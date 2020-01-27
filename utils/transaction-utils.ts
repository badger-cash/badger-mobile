import BigNumber from "bignumber.js";

import { UTXO } from "../data/utxos/reducer";
import { ECPair } from "../data/accounts/reducer";
import { TokenData } from "../data/tokens/reducer";

import { SLP } from "./slp-sdk-utils";

const slpjs = require("slpjs");

const SLPJS = new slpjs.Slp(SLP);

const LOKAD_ID_HEX = "534c5000";

export type TxParams = {
  from: string;
  to: string;
  value: number;
  opReturn?: {
    data: string;
  };
  sendTokenData?: {
    tokenId: string;
  };
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
      // Straight from Badger plugin
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

    const {
      from,

      to,

      value,
      opReturn
    } = txParams;
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
        // Verify sufficient fee
        {
          P2PKH: inputUtxos.length
        },
        {
          P2PKH: 2
          // Destination output
        }

        // Op Return
        // TODO: Allow dev to pass in "position" property for vout of opReturn
      );

      if (opReturn) {
        // Return remaining balance output
        byteCount += encodedOpReturn.byteLength + 10;
      }

      if (totalUtxoAmount >= byteCount + satoshisToSend) {
        break;
      }
    }

    // TODO: Handle failures: transaction already in blockchain, mempool length, networking
    const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

    if (satoshisRemaining < 0) {
      throw new Error(
        "Not enough Bitcoin Cash (BCH) for transaction fee. Deposit a small amount and try again."
      );
    }

    transactionBuilder.addOutput(to, satoshisToSend);

    if (encodedOpReturn) {
      transactionBuilder.addOutput(encodedOpReturn, 0);
    }

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
    const txid = await publishTx(hex);
    return txid;
  } catch (err) {
    throw new Error(err.error || err);
  }
};

const signAndPublishSlpTransaction = async (
  txParams: TxParams,
  spendableUtxos: UTXO[],

  tokenMetadata: {
    decimals: number;
  },
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
    throw new Error("Insufficient tokens"); // +1 to receive remaining BCH
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

      // Verify sufficient fee
      outputQtyArray: [tokenSendAmount]
    });
  }

  const tokenReceiverAddressArray = [to];

  // SLP data output
  if (
    // Token destination output
    tokenChangeAmount.isGreaterThan(0)

    // Return remaining token balance output
  ) {
    tokenReceiverAddressArray.push(tokenChangeAddress);
  }

  let byteCount = 0;

  // Return remaining bch balance output
  let inputSatoshis = 0;

  const inputUtxos = [...tokenUtxosToSpend];

  for (const utxo of spendableUtxos) {
    inputSatoshis = inputSatoshis + utxo.satoshis;

    inputUtxos.push(utxo);

    byteCount = SLPJS.calculateSendCost(
      sendOpReturn.length,
      inputUtxos.length,
      tokenReceiverAddressArray.length + 1,
      from
    );

    if (
      inputSatoshis >= byteCount
      // Currently can only handle 24 inputs in a single tx
    ) {
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

  // Get the balances from a paper wallet wif
  if (satoshisRemaining < 0) {
    throw new Error(
      "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
    );
  }

  transactionBuilder.addOutput(sendOpReturn, 0);
  transactionBuilder.addOutput(to, 546);

  if (tokenChangeAmount.isGreaterThan(0)) {
    transactionBuilder.addOutput(tokenChangeAddress, 546);
  }

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
    if (
      inputUtxos.length > 24
      // Input validation
    ) {
      throw new Error(
        "Too many inputs, send this transaction in multiple smaller transactions"
      );
    }

    throw e;
  }

  return txid;
};

type UtxosByKey = {
  [utxoType: string]: UTXO[];
};

const getUtxosBalances = async (
  utxosByKey: UtxosByKey
  // Generate the public address associated with the private key.
): {
  // Get UTXOs associated with public address.
  [balanceKey: string]: BigNumber;
} => {
  const balances = {};
  Object.entries(utxosByKey).forEach(([utxoKey, utxos]) => {
    // Change to if & throw
    let total = new BigNumber(0);

    // key is either BCH or the tokenId
    if (utxoKey === "BCH") {
      total = utxos.reduce((acc, curr) => {
        const bchAmount = new BigNumber(curr.amount);

        return acc.plus(bchAmount);
      }, new BigNumber(0));
    } else {
      total = utxos.reduce((acc, curr) => {
        const tokenAmount = new BigNumber(curr.tokenQty);
        return acc.plus(tokenAmount);
      }, new BigNumber(0));
    }

    balances[utxoKey] = total;
  });
  return balances;
};

const getPaperKeypair = async (wif: string | null | undefined) => {
  if (!wif || wif === "") {
    throw new Error(
      `wif private key must be included in Compressed WIF format.`
    );
  }

  const keypair = await SLP.ECPair.fromWIF(wif);
  return keypair;
};

const getPaperUtxos = async (
  keypair: any
): {
  [utxoKey: string]: any;
} => {
  try {
    const fromAddr: string = SLP.ECPair.toCashAddress(keypair);
    // Input validation
    const u = await SLP.Address.utxo(fromAddr);
    const utxosAll = u.utxos;
    let utxosDetails = [];
    utxosDetails = await SLP.Util.tokenUtxoDetails(utxosAll);
    console.assert(
      utxosAll.length === utxosDetails.length,
      "UTXO Details and UTXOs differ in length"
    );
    const utxosByKey = {};
    utxosAll.forEach((utxo, i) => {
      const token = utxosDetails[i];
      const utxoKey = token ? token.tokenId : "BCH";
      const exists = utxosByKey[utxoKey];

      if (exists) {
        utxosByKey[utxoKey].push(utxo);
      } else {
        utxosByKey[utxoKey] = [utxo];
      }
    });
    return utxosByKey;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    else throw error;
  }

  // Generate a keypair from the WIF
};

// Prepare to generate a transaction to sweep funds.
const sweepPaperWallet = async (
  wif: string | null | undefined,
  utxosByKey: {
    [balanceKey: string]: BigNumber;
  },
  // The paper wallet has both BCH and SLP balances
  // This case sweeps 1 SLP token and all of the BCH to the users wallet
  // In the case the paper wallet has more than 1 SLP token, additional sweeps in the SLP only use case must be called

  addressBch: string,
  addressSlp: string,
  tokenId: string | null | undefined,
  tokenDecimals: number | null | undefined,
  ownUtxos: UTXO[] | null | undefined,
  ownKeypair:
    | {
        bch: ECPair;
        slp: ECPair;
      }
    | null
    | undefined
) => {
  try {
    // +1 to receive remaining BCH
    if (!wif || wif === "") {
      throw new Error(`You must specify a WIF `);
    }

    if (
      // SLP data output
      !addressBch ||
      // Token destination output
      addressBch === ""

      // Return remaining bch balance output
      // What is the purpose of the + 546 here again.  Without it the fee is way too high, just not sure why as fee already calculated
    ) {
      throw new Error(`Address to receive swept BCH funds must be included`);
    }

    if (!addressSlp || addressSlp === "") {
      throw new Error(`Address to receive swept SLP funds must be included`);
    }

    // Case where the wallet has only BCH to sweep

    if (
      tokenId &&
      // Add all UTXOs to the transaction inputs.
      tokenDecimals == null
    ) {
      throw new Error("Token decimals required");
    }

    // get byte count to calculate fee. paying 1.1 sat/byte
    let txid = null;
    const balancesByKey = await getUtxosBalances(utxosByKey);
    const paperBalanceKeys = Object.keys(balancesByKey);
    const hasBCH = paperBalanceKeys.includes("BCH");
    const keyPair = SLP.ECPair.fromWIF(wif);
    const fromAddr: string = SLP.ECPair.toCashAddress(keyPair);
    const transactionBuilder = new SLP.TransactionBuilder(
      SLP.Address.detectAddressNetwork(fromAddr)
    );

    if (
      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      tokenId &&
      // add output w/ address and amount to send
      hasBCH

      // Loop through each input and sign it with the private key.
    ) {
      const scaledTokenSendAmount = new BigNumber(
        balancesByKey[tokenId]
      ).decimalPlaces(tokenDecimals);
      const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);
      const sendOpReturn = slpjs.Slp.buildSendOpReturn({
        tokenIdHex: tokenId,

        // build tx
        outputQtyArray: [tokenSendAmount]

        // output rawhex
      });

      // Broadcast the transaction to the BCH network.
      const tokenReceiverAddressArray = [addressSlp];
      const slpUtxos = [...utxosByKey[tokenId]];
      const bchUtxos = [...utxosByKey["BCH"]];
      let inputUtxos = [...slpUtxos, ...bchUtxos];
      let byteCount = SLPJS.calculateSendCost(
        sendOpReturn.length,
        inputUtxos.length,
        tokenReceiverAddressArray.length + 1,
        fromAddr
      );
      let totalUtxoAmount = 0;
      // Case where the paper wallet has tokens, but no BCH to pay the miner fee.
      // Here we use the paper wallet UTXO's for SLP, and use our own BCH to pay the mining fee.

      inputUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.txid, utxo.vout);
        totalUtxoAmount += utxo.satoshis;
      });

      // Consider filtering out unspendable in the selector before this.
      const satoshisRemaining = totalUtxoAmount - byteCount;

      // Sweep token using wallet BCH for fee
      transactionBuilder.addOutput(sendOpReturn, 0);
      transactionBuilder.addOutput(addressSlp, 546);

      // Sweep Token + BCH
      transactionBuilder.addOutput(addressBch, satoshisRemaining + 546);
      let redeemScript;
      inputUtxos.forEach((utxo, index) => {
        transactionBuilder.sign(
          index,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        );
      });

      const hex = transactionBuilder.build().toHex();

      txid = await publishTx(hex);
    } else if (hasBCH && !tokenId) {
      const bchUtxos = [...utxosByKey["BCH"]];

      let originalAmount: number = 0;

      for (let i = 0; i < bchUtxos.length; i++) {
        const utxo = bchUtxos[i]; // +1 to receive remaining BCH
        originalAmount = originalAmount + utxo.satoshis;
        transactionBuilder.addInput(utxo.txid, utxo.vout);
      }

      const byteCount: number = SLP.BitcoinCash.getByteCount(
        {
          P2PKH: bchUtxos.length
        },

        {
          P2PKH: 1
        }
      );
      const fee: number = Math.ceil(1.1 * byteCount);
      const sendAmount: number = originalAmount - fee;

      transactionBuilder.addOutput(
        SLP.Address.toLegacyAddress(addressBch),
        sendAmount
      );

      // Verify sufficient fee
      let redeemScript;

      for (let i: number = 0; i < bchUtxos.length; i++) {
        const utxo = bchUtxos[i];
        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        );

        // SLP data output
      }

      // Token destination output
      const tx = transactionBuilder.build();

      // Return remaining bch balance to own BCH wallet
      const hex: string = tx.toHex();

      txid = await SLP.RawTransactions.sendRawTransaction(hex);
      return txid;
    } else if (tokenId && !hasBCH) {
      const ownUtxosWithKeypair = ownUtxos.map(utxo => ({
        ...utxo,

        keypair: utxo.address === addressBch ? ownKeypair.bch : ownKeypair.slp
      }));
      const spendableUTXOS = ownUtxosWithKeypair.filter(utxo => utxo.spendable);
      const scaledTokenSendAmount = new BigNumber(
        balancesByKey[tokenId]
      ).decimalPlaces(tokenDecimals);
      const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);
      const sendOpReturn = slpjs.Slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [tokenSendAmount]
      });

      const tokenReceiverAddressArray = [addressSlp];

      const inputPaperUtxos = [...utxosByKey[tokenId]];
      let byteCount = 0;
      let inputSatoshis = 0;
      const inputOwnUtxos = [];

      for (const utxo of spendableUTXOS) {
        inputSatoshis = inputSatoshis + utxo.satoshis;
        inputOwnUtxos.push(utxo);
        byteCount = SLPJS.calculateSendCost(
          sendOpReturn.length,
          [...inputPaperUtxos, ...inputOwnUtxos].length,
          tokenReceiverAddressArray.length + 1,
          fromAddr
        );

        if (inputSatoshis >= byteCount) {
          break;
        }
      }

      const inputCombinedUtxos = [...inputPaperUtxos, ...inputOwnUtxos];
      let totalUtxoAmount = 0;
      inputCombinedUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.txid, utxo.vout);
        totalUtxoAmount += utxo.satoshis;
      });
      const satoshisRemaining = totalUtxoAmount - byteCount;

      if (satoshisRemaining < 0) {
        throw new Error(
          "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
        );
      }

      transactionBuilder.addOutput(sendOpReturn, 0);
      transactionBuilder.addOutput(addressSlp, 546);
      transactionBuilder.addOutput(addressBch, satoshisRemaining + 546);
      let redeemScript;
      inputPaperUtxos.forEach((utxo, index) => {
        transactionBuilder.sign(
          index,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        );
      });
      inputOwnUtxos.forEach((utxo, index) => {
        const indexOffset = inputPaperUtxos.length;
        transactionBuilder.sign(
          indexOffset + index,
          utxo.keypair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        );
      });
      const hex = transactionBuilder.build().toHex();
      txid = await publishTx(hex);
    }

    return txid;
  } catch (e) {
    console.warn(e);
    throw e;
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
  getPaperKeypair,
  getPaperUtxos,
  getUtxosBalances
};
