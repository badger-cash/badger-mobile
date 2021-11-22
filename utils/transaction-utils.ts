import PaymentProtocol from "bitcore-payment-protocol";
import BigNumber from "bignumber.js";

import {
  sendTx,
  getTransaction,
  getUtxosByAddress,
  getTokenData
} from "../api/bcash";
import { UTXO, UTXOJSON } from "../data/utxos/reducer";
import { ECPair } from "../data/accounts/reducer";
import { TokenData } from "../data/tokens/reducer";

import { postAsArrayBuffer, decodePaymentResponse } from "./bip70-utils";

import { toCashAddress, toSlpAddress, toLegacyAddress } from "bchaddrjs-slp";
import { TokenType1 } from "slp-mdm";
import bcoin from "bcash";
import bcrypto from "bcrypto";

import { postageEndpoint } from "../api/pay.badger";

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
  transaction?: typeof bcoin.MTX;
}

const getSLPTxType = (scriptASMArray: typeof bcoin.Script[]) => {
  if (scriptASMArray[0].toASM() !== "OP_RETURN") {
    throw new Error("Not an OP_RETURN");
  }

  if (scriptASMArray[1].toString("hex") !== LOKAD_ID_HEX) {
    throw new Error("Not a SLP OP_RETURN");
  }

  if (scriptASMArray[2].toASM() !== "1") {
    // NOTE: bitcoincashlib-js converts hex 01 to OP_1 due to BIP62.3 enforcement
    throw new Error("Unknown token type");
  }

  var type = scriptASMArray[3].toString("ascii").toLowerCase();

  return type;
};

const getAllUtxos = async (address: string, includeTxData: boolean = true) => {
  const result = await getUtxosByAddress(address, includeTxData);
  return result;
};

const getTokenMetadata = async (tokenId: string): Promise<TokenData> => {
  const result = await getTokenData(tokenId);
  return {
    tokenId: result.tokenId,
    symbol: result.ticker,
    name: result.name,
    decimals: result.decimals,
    protocol: "slp"
  };
};

const getTransactionDetails = async (txid: string | string[]) => {
  try {
    if (typeof txid == "string") {
      const tx = await getTransaction(txid);
      tx.txid = txid;
      return tx.transaction;
    } else {
      const result = [];
      for (let i = 0; i < txid.length; i++) {
        const tx = await getTransaction(txid[i]);
        tx.txid = txid;
        result.push(tx.transaction);
      }
      return result;
    }
  } catch (e) {
    throw e;
  }
};

const txidFromHex = (hex: string) => {
  const buffer = Buffer.from(hex, "hex");
  const hash = bcrypto.Hash256.digest(buffer).toString("hex");
  const txid = hash
    .match(/[a-fA-F0-9]{2}/g)
    .reverse()
    .join("");
  return txid;
};

const getByteCount = (inputs: any, outputs: any): number => {
  // from https://github.com/bitcoinjs/bitcoinjs-lib/issues/921#issuecomment-354394004
  let totalWeight: number = 0;
  let hasWitness: boolean = false;
  // assumes compressed pubkeys in all cases.
  const types: any = {
    inputs: {
      "MULTISIG-P2SH": 49 * 4,
      "MULTISIG-P2WSH": 6 + 41 * 4,
      "MULTISIG-P2SH-P2WSH": 6 + 76 * 4,
      P2PKH: 148 * 4,
      P2WPKH: 108 + 41 * 4,
      "P2SH-P2WPKH": 108 + 64 * 4
    },
    outputs: {
      P2SH: 32 * 4,
      P2PKH: 34 * 4,
      P2WPKH: 31 * 4,
      P2WSH: 43 * 4
    }
  };

  Object.keys(inputs).forEach(function(key) {
    if (key.slice(0, 8) === "MULTISIG") {
      // ex. "MULTISIG-P2SH:2-3" would mean 2 of 3 P2SH MULTISIG
      const keyParts = key.split(":");
      if (keyParts.length !== 2) throw new Error(`invalid input: ${key}`);
      const newKey = keyParts[0];
      const mAndN = keyParts[1].split("-").map(function(item) {
        return parseInt(item);
      });

      totalWeight += types.inputs[newKey] * inputs[key];
      const multiplyer = newKey === "MULTISIG-P2SH" ? 4 : 1;
      totalWeight += (73 * mAndN[0] + 34 * mAndN[1]) * multiplyer;
    } else {
      totalWeight += types.inputs[key] * inputs[key];
    }
    if (key.indexOf("W") >= 0) hasWitness = true;
  });

  Object.keys(outputs).forEach(function(key) {
    totalWeight += types.outputs[key] * outputs[key];
  });

  if (hasWitness) totalWeight += 2;

  totalWeight += 10 * 4;

  return Math.ceil(totalWeight / 4);
};

// Straight from existing badger plugin slp-utils.js
const decodeTxOut = (txOut: UTXO) => {
  const out = {
    token: "",
    quantity: new BigNumber(0, 16),
    baton: false
  };

  const vout = parseInt(txOut.vout, 10);

  const script = bcoin.Script.fromRaw(
    txOut.tx.vout[0].scriptPubKey.hex,
    "hex"
  ).toArray();

  const type = getSLPTxType(script);

  if (type === "genesis") {
    if (
      (script[9].toASM() === "2" && vout === 2) ||
      script[9].toInt() === vout
    ) {
      out.token = txOut.txid;
      out.baton = true;
      return out;
    }

    if (vout !== 1) {
      throw new Error("Not a SLP txout");
    }

    out.token = txOut.txid;
    out.quantity = new BigNumber(script[10].toASM(), 16);
  } else if (type === "mint") {
    if (
      (script[5].toASM() === "2" && vout === 2) ||
      script[5].toInt() === vout
    ) {
      out.token = script[4].toString("hex");
      out.baton = true;
      return out;
    }

    if (txOut.vout !== 1) {
      throw new Error("Not a SLP txout");
    }

    out.token = script[4].toString("hex");

    out.quantity = new BigNumber(script[6].toASM(), 16);
  } else if (type === "send") {
    if (script.length <= vout + 4) {
      throw new Error("Not a SLP txout");
    }

    out.token = script[4].toString("hex");

    out.quantity = new BigNumber(script[vout + 4].toASM(), 16);
  } else {
    throw new Error("Invalid tx type");
  }

  return out;
};

const encodeOpReturn = (dataArray: string[]) => {
  const script = [bcoin.Opcode.fromSymbol("OP_RETURN").toRaw()];

  dataArray.forEach(data => {
    if (typeof data === "string" && data.substring(0, 2) === "0x") {
      script.push(Buffer.from(data.substring(2), "hex"));
    } else {
      script.push(Buffer.from(data));
    }
  });

  return bcoin.Script.fromItems(script).toRaw();
};

const publishTx = async (hex: string) => {
  const result = await sendTx(hex);

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
  spendableUtxos: UTXOJSON[],
  keypairs: typeof bcoin.KeyRing
) => {
  try {
    if (!spendableUtxos || spendableUtxos.length === 0) {
      throw new Error("Insufficient funds");
    }

    const { from, to, value, opReturn } = txParams;

    const satoshisToSend = parseInt(value, 10);
    const encodedOpReturn = opReturn ? encodeOpReturn(opReturn.data) : null;

    const transactionBuilder = new bcoin.MTX();
    const inputUtxos = [];
    let byteCount = 0;
    let totalUtxoAmount = 0;

    for (const utxo of spendableUtxos) {
      if (utxo.slp) {
        throw new Error("Cannot spend unspendable utxo");
      }

      const coin = bcoin.Coin.fromJSON(utxo);

      transactionBuilder.addCoin(coin);
      totalUtxoAmount += utxo.value;
      inputUtxos.push(utxo);

      byteCount = getByteCount(
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

    // Op Return
    if (encodedOpReturn) {
      transactionBuilder.addOutput(bcoin.Script.fromRaw(encodedOpReturn), 0);
    }

    // Destination output
    transactionBuilder.addOutput(bcoin.Address.fromString(to), satoshisToSend);

    // Return remaining balance output
    if (satoshisRemaining >= 546) {
      transactionBuilder.addOutput(
        bcoin.Address.fromString(from),
        satoshisRemaining
      );
    }

    transactionBuilder.sign(keypairs);
    const hex = transactionBuilder.toRaw().toString("hex");
    const txid = await publishTx(hex);
    return transactionBuilder;
  } catch (err) {
    // TODO: Handle failures elegantly: transaction already in blockchain, mempool length, networking
    throw new Error(err.error || err);
  }
};

const signAndPublishSlpTransaction = async (
  txParams: TxParams,
  spendableUtxos: UTXOJSON[],
  tokenMetadata: {
    decimals: number;
  },
  spendableTokenUtxos: UTXOJSON[],
  tokenChangeAddress: string,
  keypairs: typeof bcoin.KeyRing
) => {
  const { from, to, value, sendTokenData, postOfficeData } = txParams;
  const tokenDecimals = tokenMetadata.decimals;

  const scaledTokenSendAmount = new BigNumber(value).decimalPlaces(
    tokenDecimals
  );
  const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);

  if (!sendTokenData) {
    throw new Error("Error getting token data.");
  }

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
  let remainingTokenUtxos: UTXOJSON[] = [];

  // Gather enough SLP UTXO's
  for (let i = 0; i < spendableTokenUtxos.length; i++) {
    const tokenUtxo = spendableTokenUtxos[i];
    const utxoBalance = tokenUtxo.slp.value;
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
  sendOpReturn = TokenType1.send(sendTokenData.tokenId, outputQtyArray);

  const tokenReceiverAddressArray = [to];

  if (postOfficeData) {
    tokenReceiverAddressArray.push(postOfficeData.address);
  }

  if (tokenChangeAmount.isGreaterThan(0)) {
    tokenReceiverAddressArray.push(tokenChangeAddress);
  }

  let byteCount = 0;
  let inputSatoshis = tokenUtxosToSpend.length * 546;

  const inputUtxos = [...tokenUtxosToSpend];

  // Verify sufficient fee if not using postage protocol (BCH as "change")
  if (!postOfficeData) {
    for (const utxo of spendableUtxos) {
      byteCount = getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: tokenReceiverAddressArray.length + 1 }
      );

      byteCount += 8 + 1 + sendOpReturn.length;
      byteCount += 546 * tokenReceiverAddressArray.length; // 546 sats for each output

      if (inputSatoshis >= byteCount) {
        break;
      }

      inputSatoshis = inputSatoshis + utxo.value;
      // Be sure to add the additional bytes for the input in case last iteration
      byteCount += 148;
      inputUtxos.push(utxo);
    }
  } else {
    // Recalculate and verify sufficient fee if using postage protocol
    for (let i = 0; i <= remainingTokenUtxos.length; i++) {
      // TODO: Get this byte count more accurate
      byteCount = getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: tokenReceiverAddressArray.length }
      );

      byteCount += 8 + 1 + sendOpReturn.length;
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
        sendOpReturn = TokenType1.send(sendTokenData.tokenId, outputQtyArray);
        break;
      } else {
        if (remainingTokenUtxos.length > 0) {
          const tokenUtxo = remainingTokenUtxos[i];
          const utxoBalance = tokenUtxo.slp.value;
          tokenBalance = tokenBalance.plus(utxoBalance);
          inputUtxos.push(tokenUtxo);
          tokenChangeAmount = tokenBalance.minus(tokenSendAmount);
        } else {
          throw new Error("Insufficient tokens to pay for postage");
        }
      }
    }
  }

  const transactionBuilder = new bcoin.MTX();
  let totalUtxoAmount = 0;

  inputUtxos.forEach(utxo => {
    const coin = bcoin.Coin.fromJSON(utxo);

    transactionBuilder.addCoin(coin);

    totalUtxoAmount += utxo.value;
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
  transactionBuilder.addOutput(bcoin.Script.fromRaw(sendOpReturn), 0);

  for (let i = 0; i < tokenReceiverAddressArray.length; i++) {
    // Token destination output
    let tokenReceiverAddress = toCashAddress(tokenReceiverAddressArray[i]);
    transactionBuilder.addOutput(
      bcoin.Address.fromString(tokenReceiverAddress),
      546
    );
  }

  if (!postOfficeData && satoshisRemaining >= 546) {
    // Return remaining bch balance output
    transactionBuilder.addOutput(
      bcoin.Address.fromString(from),
      satoshisRemaining
    );
  }

  const hashTypes = bcoin.script.common.hashType;
  const sighashType = postOfficeData
    ? hashTypes.ALL | hashTypes.ANYONECANPAY
    : hashTypes.ALL;

  // Sign both BCH and SLP inputs
  transactionBuilder.sign(keypairs, sighashType);
  const hex = transactionBuilder.toRaw().toString("hex");
  // console.log(
  //   "fee = ",
  //   transactionBuilder.getInputValue() - transactionBuilder.getOutputValue()
  // );
  // console.log(hex);

  let txid = null;

  if (postOfficeData) {
    // send the postage transaction
    let payment = new PaymentProtocol().makePayment();
    let merchantData = '{"returnRawTx":false}';
    payment.set("merchant_data", Buffer.from(merchantData, "utf-8"));
    payment.set("transactions", [Buffer.from(hex, "hex")]);

    // calculate refund script pubkey
    const refundScriptPubkey = bcoin.Script.fromAddress(
      bcoin.Address.fromString(tokenChangeAddress)
    ).toRaw();

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

  return transactionBuilder;
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
  [utxoType: string]: UTXOJSON[];
};

type Balances = {
  [balanceKey: string]: BigNumber;
};

// Get the balances from utxos by type
const getUtxosBalances = async (utxosByKey: UtxosByKey): Promise<Balances> => {
  const balances = {} as Balances;
  for (const [utxoKey, utxos] of Object.entries(utxosByKey)) {
    let total = new BigNumber(0);

    if (utxoKey === "BCH") {
      total = utxos.reduce((acc, curr) => {
        const valueInBCH = curr.value / 10 ** 8;
        const bchAmount = new BigNumber(valueInBCH);

        return acc.plus(bchAmount);
      }, new BigNumber(0));
    } else {
      const tokenMeta = await getTokenMetadata(utxoKey);
      total = utxos.reduce((acc, curr) => {
        const tokenAmount = new BigNumber(
          curr.slp && tokenMeta
            ? parseInt(curr.slp.value) / 10 ** tokenMeta.decimals
            : 0
        );
        return acc.plus(tokenAmount);
      }, new BigNumber(0));
    }

    balances[utxoKey] = total;
  }

  return balances;
};

const getPaperKeypair = async (wif?: string | null) => {
  if (!wif || wif === "") {
    throw new Error(
      `wif private key must be included in Compressed WIF format.`
    );
  }

  const keypair = bcoin.KeyRing.fromSecret(wif);
  return keypair;
};

const getPaperUtxos = async (
  keypair: typeof bcoin.KeyRing
): Promise<UtxosByKey> => {
  try {
    // Generate the public address associated with the private key.
    const fromAddr: string = keypair.getKeyAddress().toString();

    // Get UTXOs associated with public address.
    const utxosAll = await getUtxosByAddress(fromAddr);

    // let utxosDetails = [] as PaperUTXO[];
    // utxosDetails = await SLP.Util.tokenUtxoDetails(utxosAll);
    // console.assert(
    //   utxosAll.length === utxosDetails.length,
    //   "UTXO Details and UTXOs differ in length"
    // );

    const utxosByKey = {} as { [utxoKey: string]: UTXOJSON[] };
    utxosAll.forEach((utxo, i) => {
      const token = utxosAll[i].slp;
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
  utxosByKey: UtxosByKey,
  addressBch: string,
  addressSlp: string,
  tokenId: string | null,
  tokenDecimals: number | null,
  ownUtxos: UTXOJSON[],
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
    const keyPair = bcoin.KeyRing.fromSecret(wif);
    // const fromAddr: string = keyPair.getKeyAddress().toString();
    const transactionBuilder = new bcoin.MTX();

    if (tokenId && tokenDecimals != null && hasBCH) {
      // SLP + BCH sweep
      // This case sweeps 1 SLP token and all of the BCH to the users wallet
      // In the case the paper wallet has more than 1 SLP token, additional sweeps in the SLP only use case must be called
      const scaledTokenSendAmount = new BigNumber(
        balancesByKey[tokenId]
      ).decimalPlaces(tokenDecimals);

      const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);
      const sendOpReturn = TokenType1.send(tokenId, [tokenSendAmount]);

      const tokenReceiverAddressArray = [addressSlp];
      const slpUtxos = [...utxosByKey[tokenId]];
      const bchUtxos = [...utxosByKey["BCH"]];
      let inputUtxos = [...slpUtxos, ...bchUtxos];

      let byteCount = getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: tokenReceiverAddressArray.length + 1 }
      );

      byteCount += 8 + 1 + sendOpReturn.length;
      byteCount += 546 * tokenReceiverAddressArray.length + 1; // 546 sats for each output

      let totalUtxoAmount = 0;

      inputUtxos.forEach(utxo => {
        const coin = bcoin.Coin.fromJSON(utxo);

        transactionBuilder.addCoin(coin);
        totalUtxoAmount += utxo.value;
      });
      const satoshisRemaining = totalUtxoAmount - byteCount;

      // SLP data output
      transactionBuilder.addOutput(bcoin.Script.fromRaw(sendOpReturn), 0);

      // Token destination output
      transactionBuilder.addOutput(bcoin.Address.fromString(addressSlp), 546);

      // Return remaining bch balance output
      if (satoshisRemaining >= 546)
        transactionBuilder.addOutput(
          bcoin.Address.fromString(addressBch),
          satoshisRemaining
        );

      const keyPairs = [keyPair];
      if (ownKeypair) {
        keyPairs.push(ownKeypair.bch);
        keyPairs.push(ownKeypair.slp);
      }
      transactionBuilder.sign(keyPairs);
      const hex: string = transactionBuilder.toRaw().toString("hex");

      txid = await publishTx(hex);
    } else if (hasBCH && !tokenId) {
      // BCH only sweep

      const bchUtxos = [...utxosByKey["BCH"]];

      let originalAmount: number = 0;

      // Add all UTXOs to the transaction inputs.
      for (let i = 0; i < bchUtxos.length; i++) {
        const utxo = bchUtxos[i]; // +1 to receive remaining BCH
        originalAmount = originalAmount + utxo.value;
        const coin = bcoin.Coin.fromJSON(utxo);

        transactionBuilder.addCoin(coin);
      }

      // get byte count to calculate fee. paying 1.1 sat/byte
      const byteCount: number = getByteCount(
        { P2PKH: bchUtxos.length },
        { P2PKH: 1 }
      );
      const fee: number = Math.ceil(1.1 * byteCount);

      // amount to send to receiver. It's the original amount - 1 sat/byte for tx size
      const sendAmount: number = originalAmount - fee;

      // add output w/ address and amount to send
      transactionBuilder.addOutput(
        bcoin.Address.fromString(addressBch),
        sendAmount
      );

      transactionBuilder.sign(keyPair);
      const hex: string = transactionBuilder.toRaw().toString("hex");

      // Broadcast the transaction to the BCH network.
      txid = await publishTx(hex);
      return txid;
    } else if (tokenId && tokenDecimals != null && !hasBCH) {
      // SLP only sweep
      // Case where the paper wallet has tokens, but no BCH to pay the miner fee.
      // Here we use the paper wallet UTXO's for SLP, and use our own BCH to pay the mining fee.
      const spendableUTXOS = ownUtxos.filter(utxo => !utxo.slp);
      const scaledTokenSendAmount = new BigNumber(
        balancesByKey[tokenId]
      ).decimalPlaces(tokenDecimals);

      const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);
      const sendOpReturn = TokenType1.send(tokenId, [tokenSendAmount]);

      const tokenReceiverAddressArray = [addressSlp];

      const inputPaperUtxos = [...utxosByKey[tokenId]];

      let byteCount = 0;
      let inputSatoshis = 0;
      const inputOwnUtxos = [];

      // Sweep token using wallet BCH for fee
      for (const utxo of spendableUTXOS) {
        inputSatoshis = inputSatoshis + utxo.value;
        inputOwnUtxos.push(utxo);

        byteCount = getByteCount(
          { P2PKH: [...inputPaperUtxos, ...inputOwnUtxos].length },
          { P2PKH: tokenReceiverAddressArray.length + 1 }
        );

        byteCount += sendOpReturn.length;
        byteCount += 546 * tokenReceiverAddressArray.length + 1; // 546 sats for each output

        if (inputSatoshis >= byteCount) {
          break;
        }
      }

      const inputCombinedUtxos = [...inputPaperUtxos, ...inputOwnUtxos];
      let totalUtxoAmount = 0;
      inputCombinedUtxos.forEach(utxo => {
        const coin = bcoin.Coin.fromJSON(utxo);

        transactionBuilder.addCoin(coin);
        totalUtxoAmount += utxo.value;
      });
      const satoshisRemaining = totalUtxoAmount - byteCount;
      console.log(inputSatoshis, byteCount, satoshisRemaining);

      // Verify sufficient fee
      if (satoshisRemaining < 0) {
        throw new Error(
          "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
        );
      }

      // SLP Data output
      transactionBuilder.addOutput(bcoin.Script.fromRaw(sendOpReturn), 0);

      // Token destination output
      transactionBuilder.addOutput(bcoin.Address.fromString(addressSlp), 546);

      // return remaining BCH to own wallet if greater than dust
      if (satoshisRemaining >= 546)
        transactionBuilder.addOutput(
          bcoin.Address.fromString(addressBch),
          satoshisRemaining
        );

      const keyPairs = [keyPair];
      if (ownKeypair) {
        keyPairs.push(ownKeypair.bch);
        keyPairs.push(ownKeypair.slp);
      }
      transactionBuilder.sign(keyPairs);
      const hex: string = transactionBuilder.toRaw().toString("hex");

      txid = await publishTx(hex);
    } else {
      throw new Error("Unknown sweep error, try again");
    }

    return transactionBuilder;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

export {
  getTokenMetadata,
  decodeTxOut,
  getByteCount,
  getAllUtxos,
  getTransactionDetails,
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction,
  sweepPaperWallet,
  getPaperKeypair,
  getPaperUtxos,
  getUtxosBalances
};
