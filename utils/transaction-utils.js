// @flow

import SLPSDK from "slp-sdk";
import BigNumber from "bignumber.js";
import slpjs from "slpjs";

import { type UTXO } from "../data/utxos/reducer";
import { type TokenData } from "../data/tokens/reducer";

const SLP = new SLPSDK();

const LOKAD_ID_HEX = "534c5000";

const getAllUtxo = async (address: string) => {
  const result = await SLP.Address.utxo(address);
  return result.utxos;
};

// const getLargestUtxo = async (address: string) => {
//   const result = await SLP.address.utxo(address);
//   try {
//     const utxo = result.utxos.sort((a, b) => {
//       return a.satoshis - b.satoshis;
//     })[result.utxos.length - 1];
//     return utxo;
//   } catch (err) {
//     throw err;
//   }
// };

const getTransactionDetails = async (txid: string) => {
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

  if (script[0] !== "OP_RETURN") {
    throw new Error("Not an OP_RETURN");
  }

  if (script[1] !== LOKAD_ID_HEX) {
    throw new Error("Not a SLP OP_RETURN");
  }

  if (script[2] !== "OP_1") {
    // NOTE: bitcoincashlib-js converts hex 01 to OP_1 due to BIP62.3 enforcement
    throw new Error("Unknown token type");
  }

  const type = Buffer.from(script[3], "hex")
    .toString("ascii")
    .toLowerCase();

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
const decodeTokenMetadata = (txDetails): TokenData => {
  const script = SLP.Script.toASM(
    Buffer.from(txDetails.vout[0].scriptPubKey.hex, "hex")
  ).split(" ");

  if (script[0] !== "OP_RETURN") {
    throw new Error("Not an OP_RETURN");
  }

  if (script[1] !== LOKAD_ID_HEX) {
    throw new Error("Not a SLP OP_RETURN");
  }

  if (script[2] !== "OP_1") {
    // NOTE: bitcoincashlib-js converts hex 01 to OP_1 due to BIP62.3 enforcement
    throw new Error("Unknown token type");
  }

  const type = Buffer.from(script[3], "hex")
    .toString("ascii")
    .toLowerCase();

  if (type === "genesis") {
    return {
      tokenId: txDetails.txid,
      symbol: Buffer.from(script[4], "hex").toString("ascii"),
      name: Buffer.from(script[5], "hex").toString("ascii"),
      decimals: (out.decimals = script[8].startsWith("OP_")
        ? parseInt(script[8].slice(3), 10)
        : parseInt(script[8], 16)),
      protocol: "slp"
    };
  } else {
    throw new Error("Invalid tx type");
  }
};

// const encodeOpReturn = async dataArray => {
//   const script = [SLP.Script.opcodes.OP_RETURN];
//   dataArray.forEach(data => {
//     if (typeof data === "string" && data.substring(0, 2) === "0x") {
//       script.push(Buffer.from(data.substring(2), "hex"));
//     } else {
//       script.push(Buffer.from(data));
//     }
//   });
//   return SLP.Script.encode(script);
// };

// const publishTx = async hex => {
//   const result = await SLP.RawTransactions.sendRawTransaction(hex);
//   try {
//     if (result[0].length == 64) {
//       return result[0];
//     }
//     throw new Error(`Transaction Failed: ${result}`);
//   } catch (e) {
//     throw e;
//   }
// };

// const signAndPublishBchTransaction = async (
//   txParams,
//   keyPair,
//   spendableUtxos
// ) => {
//   const from = txParams.from;
//   const to = txParams.to;
//   const satoshisToSend = parseInt(txParams.value, 10);

//   if (!spendableUtxos || spendableUtxos.length === 0) {
//     throw new Error("Insufficient funds");
//   }

//   let byteCount = SLP.BitcoinCash.getByteCount(
//     { P2PKH: spendableUtxos.length },
//     { P2PKH: 2 }
//   );
//   if (txParams.opReturn) {
//     byteCount += this.encodeOpReturn(txParams.opReturn.data).byteLength + 10;
//   }

//   const transactionBuilder = new SLP.TransactionBuilder("mainnet");

//   let totalUtxoAmount = 0;

//   spendableUtxos.forEach(utxo => {
//     if (utxo.spendable !== true) {
//       throw new Error("Cannot spend unspendable utxo");
//     }
//     transactionBuilder.addInput(utxo.txid, utxo.vout);
//     totalUtxoAmount += utxo.satoshis;
//   });

//   const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

//   // Destination output
//   transactionBuilder.addOutput(to, satoshisToSend);

//   // Op Return
//   // TODO: Allow dev to pass in "position" property for vout of opReturn
//   if (txParams.opReturn) {
//     const encodedOpReturn = this.encodeOpReturn(txParams.opReturn.data);
//     transactionBuilder.addOutput(encodedOpReturn, 0);
//   }

//   // Return remaining balance output
//   if (satoshisRemaining >= 546) {
//     transactionBuilder.addOutput(from, satoshisRemaining);
//   }

//   let redeemScript;
//   spendableUtxos.forEach((utxo, index) => {
//     transactionBuilder.sign(
//       index,
//       keyPair,
//       redeemScript,
//       transactionBuilder.hashTypes.SIGHASH_ALL,
//       utxo.satoshis
//     );
//   });

//   const hex = transactionBuilder.build().toHex();

//   // TODO: Handle failures: transaction already in blockchain, mempool length, networking
//   const txid = await this.publishTx(hex);
//   return txid;
// };

// const signAndPublishSlpTransaction = async (
//   txParams,
//   keyPair,
//   spendableUtxos,
//   tokenMetadata,
//   spendableTokenUtxos
// ) => {
//   const from = txParams.from;
//   const to = txParams.to;
//   const tokenDecimals = tokenMetadata.decimals;
//   const scaledTokenSendAmount = new BigNumber(txParams.value).decimalPlaces(
//     tokenDecimals
//   );
//   const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);

//   let tokenBalance = new BigNumber(0);
//   for (const tokenUtxo of spendableTokenUtxos) {
//     const utxoBalance = tokenUtxo.slp.quantity;
//     tokenBalance = tokenBalance.plus(utxoBalance);
//   }

//   if (!tokenBalance.gte(tokenSendAmount)) {
//     throw new Error("Insufficient tokens");
//   }

//   const tokenChangeAmount = tokenBalance.minus(tokenSendAmount);

//   const sendOpReturn = slpjs.slp.buildSendOpReturn({
//     tokenIdHex: txParams.sendTokenData.tokenId,
//     outputQtyArray: [tokenSendAmount, tokenChangeAmount]
//   });

//   const inputUtxos = spendableUtxos.concat(spendableTokenUtxos);

//   const tokenReceiverAddressArray = [to, from];

//   const transactionBuilder = new SLP.TransactionBuilder("mainnet");

//   let totalUtxoAmount = 0;
//   inputUtxos.forEach(utxo => {
//     transactionBuilder.addInput(utxo.txid, utxo.vout);
//     totalUtxoAmount += utxo.satoshis;
//   });

//   const byteCount = slpjs.slp.calculateSendCost(
//     sendOpReturn.length,
//     inputUtxos.length,
//     tokenReceiverAddressArray.length + 1, // +1 to receive remaining BCH
//     from
//   );

//   const satoshisRemaining = totalUtxoAmount - byteCount;

//   // SLP data output
//   transactionBuilder.addOutput(sendOpReturn, 0);

//   // Token destination output
//   transactionBuilder.addOutput(to, 546);

//   // Return remaining token balance output
//   transactionBuilder.addOutput(from, 546);

//   // Return remaining bch balance output
//   transactionBuilder.addOutput(from, satoshisRemaining + 546);

//   let redeemScript;
//   inputUtxos.forEach((utxo, index) => {
//     transactionBuilder.sign(
//       index,
//       keyPair,
//       redeemScript,
//       transactionBuilder.hashTypes.SIGHASH_ALL,
//       utxo.satoshis
//     );
//   });

//   const hex = transactionBuilder.build().toHex();

//   const txid = await this.publishTx(hex);
//   return txid;
// };

export { getAllUtxo, getTransactionDetails, decodeTxOut, decodeTokenMetadata };
