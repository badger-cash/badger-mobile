// @flow

import BigNumber from "bignumber.js";

import { type UTXO } from "../data/utxos/reducer";
import { type TokenData } from "../data/tokens/reducer";

import { SLP } from "./slp-sdk-utils";

const slpjs = require("slpjs");

const SLPJS = new slpjs.Slp(SLP);

const LOKAD_ID_HEX = "534c5000";

export type TxParams = {
  from: string,
  to: string,
  value: number,
  opReturn?: { data: string },
  sendTokenData?: { tokenId: string }
};

const getSLPTxType = (scriptASMArray: string[]) => {
  if (scriptASMArray[0] !== "OP_RETURN") {
    throw new Error("Not an OP_RETURN");
  }

  if (scriptASMArray[1] !== LOKAD_ID_HEX) {
    throw new Error("Not a SLP OP_RETURN");
  }

  if (scriptASMArray[2] !== "OP_1") {
    // NOTE: bitcoincashlib-js converts hex 01 to OP_1 due to BIP62.3 enforcement
    throw new Error("Unknown token type");
  }

  var type = Buffer.from(scriptASMArray[3], "hex")
    .toString("ascii")
    .toLowerCase();

  return type;
};

const getAllUtxo = async (address: string) => {
  const result = await SLP.Address.utxo(address);
  return result.utxos;
};

const getTransactionDetails = async (txid: string | string[]) => {
  try {
    const result = await SLP.Transaction.details(txid);
    return result;
  } catch (e) {
    throw e;
  }
};

// Straight from existing badger plugin slp-utils.js
const decodeTxOut = (txOut: UTXO) => {
  const out = {
    token: "",
    quantity: new BigNumber(0, 16),
    baton: false
  };

  const vout = parseInt(txOut.vout, 10);

  const script = SLP.Script.toASM(
    Buffer.from(txOut.tx.vout[0].scriptPubKey.hex, "hex")
  ).split(" ");

  const type = getSLPTxType(script);

  if (type === "genesis") {
    if (typeof script[9] === "string" && script[9].startsWith("OP_")) {
      script[9] = parseInt(script[9].slice(3), 10).toString(16);
    }
    if (
      (script[9] === "OP_2" && vout === 2) ||
      parseInt(script[9], 16) === vout
    ) {
      out.token = txOut.txid;
      out.baton = true;
      return out;
    }
    if (vout !== 1) {
      throw new Error("Not a SLP txout");
    }
    out.token = txOut.txid;
    out.quantity = new BigNumber(script[10], 16);
  } else if (type === "mint") {
    if (typeof script[5] === "string" && script[5].startsWith("OP_")) {
      script[5] = parseInt(script[5].slice(3), 10).toString(16);
    }
    if (
      (script[5] === "OP_2" && vout === 2) ||
      parseInt(script[5], 16) === vout
    ) {
      out.token = script[4];
      out.baton = true;
      return out;
    }

    if (txOut.vout !== 1) {
      throw new Error("Not a SLP txout");
    }
    out.token = script[4];

    if (typeof script[6] === "string" && script[6].startsWith("OP_")) {
      script[6] = parseInt(script[6].slice(3), 10).toString(16);
    }
    out.quantity = new BigNumber(script[6], 16);
  } else if (type === "send") {
    if (script.length <= vout + 4) {
      throw new Error("Not a SLP txout");
    }

    out.token = script[4];

    if (
      typeof script[vout + 4] === "string" &&
      script[vout + 4].startsWith("OP_")
    ) {
      script[vout + 4] = parseInt(script[vout + 4].slice(3), 10).toString(16);
    }
    out.quantity = new BigNumber(script[vout + 4], 16);
  } else {
    throw new Error("Invalid tx type");
  }

  return out;
};

// Straight from Badger plugin
const decodeTokenMetadata = (txDetails: UTXO): TokenData => {
  const script = SLP.Script.toASM(
    Buffer.from(txDetails.vout[0].scriptPubKey.hex, "hex")
  ).split(" ");

  const type = getSLPTxType(script);

  if (type === "genesis") {
    return {
      tokenId: txDetails.txid,
      symbol: Buffer.from(script[4], "hex").toString("ascii"),
      name: Buffer.from(script[5], "hex").toString("ascii"),
      decimals: script[8].startsWith("OP_")
        ? parseInt(script[8].slice(3), 10)
        : parseInt(script[8], 16),
      protocol: "slp"
    };
  } else {
    throw new Error("Invalid tx type");
  }
};

const encodeOpReturn = async dataArray => {
  const script = [SLP.Script.opcodes.OP_RETURN];
  dataArray.forEach(data => {
    if (typeof data === "string" && data.substring(0, 2) === "0x") {
      script.push(Buffer.from(data.substring(2), "hex"));
    } else {
      script.push(Buffer.from(data));
    }
  });
  return await SLP.Script.encode(script);
};

const publishTx = async hex => {
  const result = await SLP.RawTransactions.sendRawTransaction(hex);
  try {
    if (result.length === 64) {
      return result;
    }
    throw new Error(`Transaction Failed: ${result}`);
  } catch (e) {
    throw e;
  }
};

const signAndPublishBchTransaction = async (
  txParams: TxParams,
  spendableUtxos: UTXO[]
) => {
  try {
    if (!spendableUtxos || spendableUtxos.length === 0) {
      throw new Error("Insufficient funds");
    }

    const { from, to, value, opReturn } = txParams;
    const satoshisToSend = parseInt(value, 10);

    const encodedOpReturn = opReturn
      ? await encodeOpReturn(opReturn.data)
      : null;
    const transactionBuilder = new SLP.TransactionBuilder("mainnet");

    const inputUtxos = [];
    let byteCount = 0;
    let totalUtxoAmount = 0;

    for (const utxo of spendableUtxos) {
      if (utxo.spendable !== true) {
        throw new Error("Cannot spend unspendable utxo");
      }
      transactionBuilder.addInput(utxo.txid, utxo.vout);
      totalUtxoAmount += utxo.satoshis;

      inputUtxos.push(utxo);

      byteCount = SLP.BitcoinCash.getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: 2 }
      );
      if (opReturn) {
        byteCount += encodedOpReturn.byteLength + 10;
      }

      if (totalUtxoAmount >= byteCount + satoshisToSend) {
        break;
      }
    }

    const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

    // Verify sufficient fee
    if (satoshisRemaining < 0) {
      throw new Error(
        "Not enough Bitcoin Cash (BCH) for transaction fee. Deposit a small amount and try again."
      );
    }
    // Destination output
    transactionBuilder.addOutput(to, satoshisToSend);

    // Op Return
    // TODO: Allow dev to pass in "position" property for vout of opReturn
    if (encodedOpReturn) {
      transactionBuilder.addOutput(encodedOpReturn, 0);
    }

    // Return remaining balance output
    if (satoshisRemaining >= 546) {
      transactionBuilder.addOutput(from, satoshisRemaining);
    }

    let redeemScript;
    inputUtxos.forEach((utxo, index) => {
      transactionBuilder.sign(
        index,
        utxo.keypair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        utxo.satoshis
      );
    });

    const hex = transactionBuilder.build().toHex();

    // TODO: Handle failures: transaction already in blockchain, mempool length, networking
    const txid = await publishTx(hex);
    return txid;
  } catch (err) {
    throw new Error(err.error || err);
  }
};

const signAndPublishSlpTransaction = async (
  txParams: TxParams,
  spendableUtxos: UTXO[],
  tokenMetadata: { decimals: number },
  spendableTokenUtxos: UTXO[],
  tokenChangeAddress: string
) => {
  const from = txParams.from;

  const to = txParams.to;
  const tokenDecimals = tokenMetadata.decimals;
  const scaledTokenSendAmount = new BigNumber(txParams.value).decimalPlaces(
    tokenDecimals
  );
  const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);

  if (tokenSendAmount.lt(1)) {
    throw new Error(
      "Amount below minimum for this token. Increase the send amount and try again."
    );
  }

  let tokenBalance = new BigNumber(0);
  const tokenUtxosToSpend = [];
  for (const tokenUtxo of spendableTokenUtxos) {
    const utxoBalance = tokenUtxo.slp.quantity;
    tokenBalance = tokenBalance.plus(utxoBalance);
    tokenUtxosToSpend.push(tokenUtxo);

    if (tokenBalance.gte(tokenSendAmount)) {
      break;
    }
  }

  if (!tokenBalance.gte(tokenSendAmount)) {
    throw new Error("Insufficient tokens");
  }

  const tokenChangeAmount = tokenBalance.minus(tokenSendAmount);

  let sendOpReturn = null;

  if (tokenChangeAmount.isGreaterThan(0)) {
    sendOpReturn = slpjs.Slp.buildSendOpReturn({
      tokenIdHex: txParams.sendTokenData.tokenId,
      outputQtyArray: [tokenSendAmount, tokenChangeAmount]
    });
  } else {
    sendOpReturn = slpjs.Slp.buildSendOpReturn({
      tokenIdHex: txParams.sendTokenData.tokenId,
      outputQtyArray: [tokenSendAmount]
    });
  }

  const tokenReceiverAddressArray = [to];
  if (tokenChangeAmount.isGreaterThan(0)) {
    tokenReceiverAddressArray.push(tokenChangeAddress);
  }

  let byteCount = 0;
  let inputSatoshis = 0;
  const inputUtxos = [...tokenUtxosToSpend];
  for (const utxo of spendableUtxos) {
    inputSatoshis = inputSatoshis + utxo.satoshis;
    inputUtxos.push(utxo);

    byteCount = SLPJS.calculateSendCost(
      sendOpReturn.length,
      inputUtxos.length,
      tokenReceiverAddressArray.length + 1, // +1 to receive remaining BCH
      from
    );

    if (inputSatoshis >= byteCount) {
      break;
    }
  }

  const transactionBuilder = new SLP.TransactionBuilder("mainnet");

  let totalUtxoAmount = 0;
  inputUtxos.forEach(utxo => {
    transactionBuilder.addInput(utxo.txid, utxo.vout);
    totalUtxoAmount += utxo.satoshis;
  });

  const satoshisRemaining = totalUtxoAmount - byteCount;

  // Verify sufficient fee
  if (satoshisRemaining < 0) {
    throw new Error(
      "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
    );
  }

  // SLP data output
  transactionBuilder.addOutput(sendOpReturn, 0);

  // Token destination output
  transactionBuilder.addOutput(to, 546);

  // Return remaining token balance output
  if (tokenChangeAmount.isGreaterThan(0)) {
    transactionBuilder.addOutput(tokenChangeAddress, 546);
  }

  // Return remaining bch balance output
  transactionBuilder.addOutput(from, satoshisRemaining + 546);

  let redeemScript;
  inputUtxos.forEach((utxo, index) => {
    transactionBuilder.sign(
      index,
      utxo.keypair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      utxo.satoshis
    );
  });

  const hex = transactionBuilder.build().toHex();

  let txid = null;
  try {
    txid = await publishTx(hex);
  } catch (e) {
    // Currently can only handle 24 inputs in a single tx
    if (inputUtxos.length > 24) {
      throw new Error(
        "Too many inputs, send this transaction in multiple smaller transactions"
      );
    }
    throw new Error(e.message);
  }

  return txid;
};

// WHAT DOING
// - 1 function to get all BALANCES
// - Next to take a token ID and SWEEP it
//   - Using BCH on wallet if exist
//   - Use own BCH if it doesn't

// Get the balances from a paper wallet wif
const getPaperBalance = async (
  wif: ?string
): { coinType: string, balance: number }[] => {
  try {
    // Input validation
    if (!wif || wif === "") {
      throw new Error(
        `wif private key must be included in compressed WIF format.`
      );
    }
    // Generate a keypair from the WIF.
    const keyPair = SLP.ECPair.fromWIF(wif);

    // Generate the public address associated with the private key.
    const fromAddr: string = SLP.ECPair.toCashAddress(keyPair);

    // Check the BCH balance of that public address.
    const details = await SLP.Address.details(fromAddr);
    const balance: number = details.balance;

    // If balance is zero or balanceOnly flag is passed in, exit.
    return [{ coinType: "BCH", balance }];
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    else throw error;
  }
};

const sweepPaperWallet = async (
  wif: ?string,
  bchAddr: string,
  slpAddr: string
) => {
  try {
    // Input validation
    if (!wif || wif === "") {
      throw new Error(
        `wif private key must be included in Compressed WIF format.`
      );
    }
    if (!bchAddr || bchAddr === "") {
      throw new Error(`Address to receive swept funds must be included`);
    }
    // Generate a keypair from the WIF.
    const keyPair = SLP.ECPair.fromWIF(wif);

    // Generate the public address associated with the private key.
    const fromAddr: string = SLP.ECPair.toCashAddress(keyPair);

    // Check the BCH balance of that public address.
    const details = await SLP.Address.details(fromAddr);
    const balance: number = details.balance;

    // If balance is zero, no sweep needed, return
    if (balance === 0) return;

    // Get UTXOs associated with public address.
    const u = await SLP.Address.utxo(fromAddr);
    const utxos: UTXO[] = u.utxos;

    // Prepare to generate a transaction to sweep funds.
    const transactionBuilder = new SLP.TransactionBuilder(
      SLP.Address.detectAddressNetwork(fromAddr)
    );
    let originalAmount: number = 0;

    // Add all UTXOs to the transaction inputs.
    for (let i = 0; i < utxos.length; i++) {
      const utxo: utxo = utxos[i];
      originalAmount = originalAmount + utxo.satoshis;
      transactionBuilder.addInput(utxo.txid, utxo.vout);
    }

    if (originalAmount < 1) {
      throw new Error(`Original amount is zero. No BCH to send.`);
    }

    // get byte count to calculate fee. paying 1.1 sat/byte
    const byteCount: number = SLP.BitcoinCash.getByteCount(
      { P2PKH: utxos.length },
      { P2PKH: 1 }
    );
    const fee: number = Math.ceil(1.1 * byteCount);

    // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
    const sendAmount: number = originalAmount - fee;

    // add output w/ address and amount to send
    transactionBuilder.addOutput(
      SLP.Address.toLegacyAddress(bchAddr),
      sendAmount
    );

    // Loop through each input and sign it with the private key.
    let redeemScript;
    for (let i: number = 0; i < utxos.length; i++) {
      const utxo = utxos[i];
      transactionBuilder.sign(
        i,
        keyPair,
        redeemScript,
        transactionBuilder.hashTypes.SIGHASH_ALL,
        utxo.satoshis
      );
    }

    // build tx
    const tx: any = transactionBuilder.build();

    // output rawhex
    const hex: string = tx.toHex();

    // Broadcast the transaction to the BCH network.
    let txid: string = await SLP.RawTransactions.sendRawTransaction(hex);
    return txid;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    else throw error;
  }
};

export {
  decodeTokenMetadata,
  decodeTxOut,
  getAllUtxo,
  getTransactionDetails,
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction,
  sweepPaperWallet,
  getPaperBalance
};
