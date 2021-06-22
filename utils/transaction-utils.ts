import PaymentProtocol from "bitcore-payment-protocol";
import BigNumber from "bignumber.js";

import { grpcUrl, getUtxosByAddress } from "../api/grpc";
import { UTXO } from "../data/utxos/reducer";
import { ECPair } from "../data/accounts/reducer";
import { TokenData } from "../data/tokens/reducer";

import { postAsArrayBuffer, decodePaymentResponse } from "./bip70-utils";

import { SLP } from "./slp-sdk-utils";

import { postageEndpoint } from "../api/pay.badger";

const slpjs = require("slpjs");

const SLPJS = new slpjs.Slp(SLP);

const LOKAD_ID_HEX = "534c5000";

export interface TxParams {
  from: string;
  to: string;
  value: string;
  opReturn?: {
    data: string[];
  };
  sendTokenData?: {
    tokenId: string;
  };
  postOfficeData?: object | null;
}

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

const getAllUtxoGrpc = async (
  address: string,
  includeTxData: boolean = true
) => {
  const result = await getUtxosByAddress(address, includeTxData);
  return result;
};

const getTransactionDetails = async (txid: string | string[]) => {
  try {
    const result = await SLP.Transaction.details(txid);
    return result;
  } catch (e) {
    throw e;
  }
};

const txidFromHex = (hex: string) => {
  const buffer = Buffer.from(hex, "hex");
  const hash = SLP.Crypto.hash256(buffer).toString("hex");
  const txid = hash
    .match(/[a-fA-F0-9]{2}/g)
    .reverse()
    .join("");
  return txid;
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

const encodeOpReturn = async (dataArray: string[]) => {
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

const publishTx = async (hex: string) => {
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
        {
          P2PKH: inputUtxos.length
        },
        {
          P2PKH: 2
        }
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

    let redeemScript: any;
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
    // TODO: Handle failures elegantly: transaction already in blockchain, mempool length, networking
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

  const sendTokenData = txParams.sendTokenData;
  if (!sendTokenData) {
    throw new Error("Error getting token data.");
  }

  const postOfficeData = txParams.postOfficeData;

  let stampObj;
  if (postOfficeData)
    stampObj = postOfficeData.stamps.find(
      stamp => stamp.tokenId == sendTokenData.tokenId
    );

  if (tokenSendAmount.lt(1)) {
    throw new Error(
      "Amount below minimum for this token. Increase the send amount and try again."
    );
  }

  let tokenBalance = new BigNumber(0);
  let tokenChangeAmount = new BigNumber(0);
  const tokenUtxosToSpend = [];
  let remainingTokenUtxos = [];

  // Gather enough SLP UTXO's
  for (let i = 0; i < spendableTokenUtxos.length; i++) {
    const tokenUtxo = spendableTokenUtxos[i];
    const utxoBalance = tokenUtxo.slp.quantity;
    tokenBalance = tokenBalance.plus(utxoBalance);
    tokenUtxosToSpend.push(tokenUtxo);
    tokenChangeAmount = tokenBalance.minus(tokenSendAmount);

    if (tokenBalance.gte(tokenSendAmount)) {
      // Calculate postage and add UTXOs if necessary
      if (postOfficeData) {
        if (tokenBalance.eq(tokenSendAmount)) continue;
        else if (spendableTokenUtxos.length > i + 1)
          remainingTokenUtxos = spendableTokenUtxos.slice(i + 1);
      }
      break;
    }
  }

  if (!tokenBalance.gte(tokenSendAmount)) {
    throw new Error("Insufficient tokens");
  }

  let sendOpReturn = null;
  let outputQtyArray = [];

  if (tokenChangeAmount.isGreaterThan(0)) {
    // Put a placeholder to do postage calculation
    if (postOfficeData) {
      let placeholder = new BigNumber(0);
      outputQtyArray = [tokenSendAmount, placeholder, tokenChangeAmount];
    } else {
      outputQtyArray = [tokenSendAmount, tokenChangeAmount];
    }
  } else {
    outputQtyArray = [tokenSendAmount];
  }

  // Build The OP_RETURN
  sendOpReturn = slpjs.Slp.buildSendOpReturn({
    tokenIdHex: sendTokenData.tokenId,
    outputQtyArray: outputQtyArray
  });

  const tokenReceiverAddressArray = [to];

  if (postOfficeData) {
    tokenReceiverAddressArray.push(postOfficeData.address);
  }

  if (tokenChangeAmount.isGreaterThan(0)) {
    tokenReceiverAddressArray.push(tokenChangeAddress);
  }

  let byteCount = 0;
  let inputSatoshis = 0;

  const inputUtxos = [...tokenUtxosToSpend];

  // Verify sufficient fee if not using postage protocol (BCH as "change")
  if (!postOfficeData) {
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
  } else {
    // Recalculate and verify sufficient fee if using postage protocol
    for (let i = 0; i <= remainingTokenUtxos.length; i++) {
      // TODO: Get this byte count more accurate
      byteCount = SLP.BitcoinCash.getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: tokenReceiverAddressArray.length }
      );

      byteCount += sendOpReturn.length;
      // Account for difference in inputs and outputs
      byteCount += 546 * (tokenReceiverAddressArray.length - inputUtxos.length);

      let stampsNeeded = Math.ceil(byteCount / postOfficeData.weight);
      if (stampsNeeded < 1) stampsNeeded = 1;
      let stampPayment = stampObj.rate * stampsNeeded;

      if (tokenChangeAmount.isGreaterThan(stampPayment)) {
        // Recalculate and rebuild sendOpReturn
        const postageBN = new BigNumber(stampPayment);
        outputQtyArray = [
          tokenSendAmount,
          postageBN,
          tokenChangeAmount.minus(postageBN)
        ];
        console.log("outputQtyArray", outputQtyArray);
        sendOpReturn = slpjs.Slp.buildSendOpReturn({
          tokenIdHex: sendTokenData.tokenId,
          outputQtyArray: outputQtyArray
        });
        break;
      } else {
        if (remainingTokenUtxos.length > 0) {
          const tokenUtxo = remainingTokenUtxos[i];
          const utxoBalance = tokenUtxo.slp.quantity;
          tokenBalance = tokenBalance.plus(utxoBalance);
          inputUtxos.push(tokenUtxo);
          tokenChangeAmount = tokenBalance.minus(tokenSendAmount);
        } else {
          throw new Error("Insufficient tokens to pay for postage");
        }
      }
    }
  }

  const transactionBuilder = new SLP.TransactionBuilder("mainnet");
  let totalUtxoAmount = 0;

  inputUtxos.forEach(utxo => {
    transactionBuilder.addInput(utxo.txid, utxo.vout);

    totalUtxoAmount += utxo.satoshis;
  });
  const satoshisRemaining = totalUtxoAmount - byteCount;

  if (!postOfficeData) {
    if (satoshisRemaining < 0 || spendableUtxos.length == 0) {
      throw new Error(
        "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
      );
    }
  }

  // SLP data output
  transactionBuilder.addOutput(sendOpReturn, 0);

  for (let i = 0; i < tokenReceiverAddressArray.length; i++) {
    // Token destination output
    let tokenReceiverAddress = SLP.Address.toCashAddress(
      tokenReceiverAddressArray[i]
    );
    transactionBuilder.addOutput(tokenReceiverAddress, 546);
  }

  if (!postOfficeData) {
    // Return remaining bch balance output
    transactionBuilder.addOutput(from, satoshisRemaining + 546);
  }

  const sighashType = postOfficeData
    ? transactionBuilder.hashTypes.SIGHASH_ALL |
      transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY
    : transactionBuilder.hashTypes.SIGHASH_ALL;

  let redeemScript: any;
  inputUtxos.forEach((utxo, index) => {
    transactionBuilder.sign(
      index,
      utxo.keypair,
      redeemScript,
      sighashType,
      utxo.satoshis
    );
  });
  const hex = transactionBuilder.build().toHex();

  let txid = null;

  if (postOfficeData) {
    // send the postage transaction
    let payment = new PaymentProtocol().makePayment();
    let merchantData = '{"returnRawTx":false}';
    payment.set("merchant_data", Buffer.from(merchantData, "utf-8"));
    payment.set("transactions", [Buffer.from(hex, "hex")]);

    // calculate refund script pubkey from change address
    const addressType = SLP.Address.detectAddressType(tokenChangeAddress);
    const addressFormat = SLP.Address.detectAddressFormat(tokenChangeAddress);
    let refundHash160 = SLP.Address.cashToHash160(tokenChangeAddress);
    let encodingFunc = SLP.Script.pubKeyHash.output.encode;
    if (addressType == "p2sh")
      encodingFunc = SLP.Script.scriptHash.output.encode;
    if (addressFormat == "legacy")
      refundHash160 = SLP.Address.legacyToHash160(tokenChangeAddress);
    const refundScriptPubkey = encodingFunc(Buffer.from(refundHash160, "hex"));

    // define the refund outputs
    let refundOutputs = [];
    let refundOutput = new PaymentProtocol().makeOutput();
    refundOutput.set("amount", 0);
    refundOutput.set("script", refundScriptPubkey);
    refundOutputs.push(refundOutput.message);
    payment.set("refund_to", refundOutputs);
    payment.set("memo", "");

    // Send to Post Office?
    const paymentUrl = postageEndpoint;

    // serialize and send
    const rawbody = payment.serialize();
    const headers = {
      Accept: "application/simpleledger-paymentack",
      "Content-Type": "application/simpleledger-payment",
      "Content-Transfer-Encoding": "binary"
    };

    // POST payment
    const rawPaymentResponse = await postAsArrayBuffer(
      paymentUrl,
      headers,
      rawbody
    );

    const { responsePayment } = await decodePaymentResponse(rawPaymentResponse);
    const responseTxHex = responsePayment.message.transactions[0].toHex();
    txid = txidFromHex(responseTxHex);
  } else {
    try {
      txid = await publishTx(hex);
    } catch (e) {
      // Currently can only handle 24 inputs in a single tx
      if (inputUtxos.length > 24) {
        throw new Error(
          "Too many inputs, send this transaction in multiple smaller transactions"
        );
      }
      throw e;
    }
  }

  return txid;
};

// Very similar to UTXO, but has `tokenQty`.  Ideally can consolidate to the same type
type PaperUTXO = {
  amount: number;
  tokenQty?: BigNumber;
  tokenId?: string;
  vout: any;
  satoshis: number;
  txid: string;
};

type UtxosByKey = {
  [utxoType: string]: PaperUTXO[];
};

type Balances = {
  [balanceKey: string]: BigNumber;
};

// Get the balances from utxos by type
const getUtxosBalances = async (utxosByKey: UtxosByKey): Promise<Balances> => {
  const balances = {} as Balances;
  Object.entries(utxosByKey).forEach(([utxoKey, utxos]) => {
    let total = new BigNumber(0);

    if (utxoKey === "BCH") {
      total = utxos.reduce((acc, curr) => {
        const bchAmount = new BigNumber(curr.amount);

        return acc.plus(bchAmount);
      }, new BigNumber(0));
    } else {
      total = utxos.reduce((acc, curr) => {
        const tokenAmount = new BigNumber(curr.tokenQty ? curr.tokenQty : 0);
        return acc.plus(tokenAmount);
      }, new BigNumber(0));
    }

    balances[utxoKey] = total;
  });
  return balances;
};

const getPaperKeypair = async (wif?: string | null) => {
  if (!wif || wif === "") {
    throw new Error(
      `wif private key must be included in Compressed WIF format.`
    );
  }

  const keypair = await SLP.ECPair.fromWIF(wif);
  return keypair;
};

const getPaperUtxos = async (keypair: ECPair): Promise<UtxosByKey> => {
  try {
    // Generate the public address associated with the private key.
    const fromAddr: string = SLP.ECPair.toCashAddress(keypair);

    // Get UTXOs associated with public address.
    const u = await SLP.Address.utxo(fromAddr);
    const utxosAll = u.utxos as PaperUTXO[];

    let utxosDetails = [] as PaperUTXO[];
    utxosDetails = await SLP.Util.tokenUtxoDetails(utxosAll);
    console.assert(
      utxosAll.length === utxosDetails.length,
      "UTXO Details and UTXOs differ in length"
    );

    const utxosByKey = {} as { [utxoKey: string]: PaperUTXO[] };
    utxosAll.forEach((utxo, i) => {
      const token = utxosDetails[i];
      const utxoKey = token ? token.tokenId : "BCH";

      if (utxoKey) {
        if (utxosByKey[utxoKey]) {
          utxosByKey[utxoKey].push(utxo);
        } else {
          utxosByKey[utxoKey] = [utxo];
        }
      }
    });
    return utxosByKey;
  } catch (error) {
    if (error.response && error.response.data) throw error.response.data;
    else throw error;
  }
};

const sweepPaperWallet = async (
  wif: string | null,
  utxosByKey: {
    [balanceKey: string]: PaperUTXO[];
  },
  addressBch: string,
  addressSlp: string,
  tokenId: string | null,
  tokenDecimals: number | null,
  ownUtxos: UTXO[],
  ownKeypair: {
    bch: ECPair;
    slp: ECPair;
  } | null
) => {
  try {
    if (!wif || wif === "") {
      throw new Error(`You must specify a WIF `);
    }

    if (!addressBch || addressBch === "") {
      throw new Error(`Address to receive swept BCH funds must be included`);
    }

    if (!addressSlp || addressSlp === "") {
      throw new Error(`Address to receive swept SLP funds must be included`);
    }

    if (tokenId && tokenDecimals == null) {
      throw new Error("Token decimals required");
    }

    let txid = null;
    const balancesByKey = await getUtxosBalances(utxosByKey);
    const paperBalanceKeys = Object.keys(balancesByKey);
    const hasBCH = paperBalanceKeys.includes("BCH");

    // Generate a keypair from the WIF
    const keyPair = SLP.ECPair.fromWIF(wif);
    const fromAddr: string = SLP.ECPair.toCashAddress(keyPair);
    const transactionBuilder = new SLP.TransactionBuilder(
      SLP.Address.detectAddressNetwork(fromAddr)
    );

    if (tokenId && tokenDecimals != null && hasBCH) {
      // SLP + BCH sweep
      // This case sweeps 1 SLP token and all of the BCH to the users wallet
      // In the case the paper wallet has more than 1 SLP token, additional sweeps in the SLP only use case must be called
      const scaledTokenSendAmount = new BigNumber(
        balancesByKey[tokenId]
      ).decimalPlaces(tokenDecimals);

      const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);
      const sendOpReturn = slpjs.Slp.buildSendOpReturn({
        tokenIdHex: tokenId,
        outputQtyArray: [tokenSendAmount]
      });

      const tokenReceiverAddressArray = [addressSlp];
      const slpUtxos = [...utxosByKey[tokenId]];
      const bchUtxos = [...utxosByKey["BCH"]];
      let inputUtxos = [...slpUtxos, ...bchUtxos];

      let byteCount = SLPJS.calculateSendCost(
        sendOpReturn.length,
        inputUtxos.length,
        tokenReceiverAddressArray.length + 1, // +1 to receive remaining BCH
        fromAddr
      );
      let totalUtxoAmount = 0;

      inputUtxos.forEach(utxo => {
        transactionBuilder.addInput(utxo.txid, utxo.vout);
        totalUtxoAmount += utxo.satoshis;
      });
      const satoshisRemaining = totalUtxoAmount - byteCount;

      // SLP data output
      transactionBuilder.addOutput(sendOpReturn, 0);

      // Token destination output
      transactionBuilder.addOutput(addressSlp, 546);

      // Return remaining bch balance output
      transactionBuilder.addOutput(addressBch, satoshisRemaining + 546);

      let redeemScript: any;
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
      // BCH only sweep

      const bchUtxos = [...utxosByKey["BCH"]];

      let originalAmount: number = 0;

      // Add all UTXOs to the transaction inputs.
      for (let i = 0; i < bchUtxos.length; i++) {
        const utxo = bchUtxos[i]; // +1 to receive remaining BCH
        originalAmount = originalAmount + utxo.satoshis;
        transactionBuilder.addInput(utxo.txid, utxo.vout);
      }

      // get byte count to calculate fee. paying 1.1 sat/byte
      const byteCount: number = SLP.BitcoinCash.getByteCount(
        { P2PKH: bchUtxos.length },
        { P2PKH: 1 }
      );
      const fee: number = Math.ceil(1.1 * byteCount);

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount: number = originalAmount - fee;

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        SLP.Address.toLegacyAddress(addressBch),
        sendAmount
      );

      let redeemScript;

      // Loop through each input and sign it with the private key.
      for (let i: number = 0; i < bchUtxos.length; i++) {
        const utxo = bchUtxos[i];
        transactionBuilder.sign(
          i,
          keyPair,
          redeemScript,
          transactionBuilder.hashTypes.SIGHASH_ALL,
          utxo.satoshis
        );
      }

      // build tx
      const tx = transactionBuilder.build();
      const hex: string = tx.toHex();

      // Broadcast the transaction to the BCH network.
      txid = await SLP.RawTransactions.sendRawTransaction(hex);
      return txid;
    } else if (tokenId && tokenDecimals != null && !hasBCH) {
      // SLP only sweep
      // Case where the paper wallet has tokens, but no BCH to pay the miner fee.
      // Here we use the paper wallet UTXO's for SLP, and use our own BCH to pay the mining fee.
      const ownUtxosWithKeypair =
        ownUtxos && ownKeypair
          ? ownUtxos.map(utxo => ({
              ...utxo,
              keypair:
                utxo.address === addressBch ? ownKeypair.bch : ownKeypair.slp
            }))
          : [];

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

      // Sweep token using wallet BCH for fee
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

      // Verify sufficient fee
      if (satoshisRemaining < 0) {
        throw new Error(
          "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
        );
      }

      // SLP Data output
      transactionBuilder.addOutput(sendOpReturn, 0);

      // Token destination output
      transactionBuilder.addOutput(addressSlp, 546);

      // return remaining BCH to own wallet
      transactionBuilder.addOutput(addressBch, satoshisRemaining + 546);
      let redeemScript: any;
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
    } else {
      throw new Error("Unknown sweep error, try again");
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
  getAllUtxoGrpc,
  getTransactionDetails,
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction,
  sweepPaperWallet,
  getPaperKeypair,
  getPaperUtxos,
  getUtxosBalances
};
