// @flow

import PaymentProtocol from "bitcore-payment-protocol";
import BigNumber from "bignumber.js";

import { SLP } from "./slp-sdk-utils";
import { type ECPair } from "../data/accounts/reducer";
import { type UTXO } from "../data/utxos/reducer";
import { decodeTxOut } from "./transaction-utils";

const slpjs = require("slpjs");
const SLPJS = new slpjs.Slp(SLP);

export type PaymentRequest = {
  expires: number,
  memo: string,
  merchantData: ?string,
  network: string,
  outputs: OutputInfo[],
  paymentUrl: string,
  requiredFeeRate: ?number,
  time: number,
  totalValue: number,
  totalTokenAmount: ?number,
  verified: boolean
};

export type MerchantData = {
  fiat_symbol: string,
  fiat_rate: number,
  fiat_amount: number
};

export type OutputInfo = {
  amount: BigNumber,
  script: string,
  tokenId: ?string,
  tokenAmount: ?BigNumber
};

const postAsArrayBuffer = (
  url: string,
  headers: {
    Accept: string,
    "Content-Type": string,
    "Content-Transfer-Encoding": string
  },
  body: any
): Promise<any> => {
  return new Promise((accept, reject) => {
    let req = new XMLHttpRequest();
    req.open("POST", url, true);
    Object.entries(headers).forEach(([key, value]) => {
      req.setRequestHeader(key, value);
    });

    req.responseType = "arraybuffer";
    req.onload = function(event) {
      let resp = req.response;

      if (req.status === 400 || req.status === 404 || req.status === 500) {
        reject(
          new Error(
            `${req.status} Error processing payment, please check with the merchant and try again.`
          )
        );
        return;
      }

      if (resp) {
        accept(resp);
      }
    };
    req.onerror = function(err) {
      console.warn(err);
      reject(err);
    };
    req.send(body);
  });
};

const getAsArrayBuffer = (
  url: string,
  headers: { Accept: string, "Content-Type": string }
): Promise<any> => {
  return new Promise((accept, reject) => {
    let req = new XMLHttpRequest();
    req.open("GET", url, true);
    Object.entries(headers).forEach(([key, value]) => {
      req.setRequestHeader(key, value);
    });

    req.responseType = "arraybuffer";

    req.onload = function(event) {
      let resp = req.response;
      if (resp) {
        accept(resp);
      }
    };
    req.onerror = function(err) {
      console.warn(err);
      reject(err);
    };
    req.send(null);
  });
};

const txidFromHex = hex => {
  const buffer = Buffer.from(hex, "hex");
  const hash = SLP.Crypto.hash256(buffer).toString("hex");
  const txid = hash
    .match(/[a-fA-F0-9]{2}/g)
    .reverse()
    .join("");
  return txid;
};

const decodePaymentResponse = async responseData => {
  const buffer = await Buffer.from(responseData);

  try {
    const responseBody = PaymentProtocol.PaymentACK.decode(buffer);
    const responseAck = new PaymentProtocol().makePaymentACK(responseBody);
    const responseSerializedPayment = responseAck.get("payment");
    const responseDecodedPayment = await PaymentProtocol.Payment.decode(
      responseSerializedPayment
    );
    const responsePayment = await new PaymentProtocol().makePayment(
      responseDecodedPayment
    );
    return { responsePayment, responseAck };
  } catch (ex) {
    throw ex;
  }
};

// Inspired by Badger extension
const decodePaymentRequest = async requestData => {
  const buffer = await Buffer.from(requestData);

  try {
    // Cleanup PR for testing and review.
    let body = PaymentProtocol.PaymentRequest.decode(buffer);
    let request = new PaymentProtocol().makePaymentRequest(body);

    const detailsData = {};
    let serializedDetails = request.get("serialized_payment_details");

    // Verify the request signature
    const verifiedData = request.verify(true);
    detailsData.verified = false;
    if (
      verifiedData.caTrusted &&
      verifiedData.chainVerified &&
      verifiedData.isChain &&
      verifiedData.selfSigned === 0 &&
      verifiedData.verified
    ) {
      detailsData.verified = true;
    } else {
      throw new Error("Request could not be verified");
    }

    // Get the payment details
    const decodedDetails = PaymentProtocol.PaymentDetails.decode(
      serializedDetails
    );
    const details = new PaymentProtocol().makePaymentDetails(decodedDetails);

    // Verify network is mainnet
    detailsData.network = details.get("network");
    if (detailsData.network !== "main") {
      throw new Error("Network must be mainnet");
    }

    // Sanity check time created is in the past
    const currentUnixTime = Math.floor(Date.now() / 1000);
    detailsData.time = details.get("time");
    if (currentUnixTime < detailsData.time) {
      throw new Error("Payment request time not valid");
    }

    // Verify request is not yet expired
    detailsData.expires = details.get("expires");
    if (detailsData.expires < currentUnixTime) {
      throw new Error("Payment request expired");
    }

    // Get memo, paymentUrl, merchantData and requiredFeeRate
    detailsData.memo = details.get("memo");
    detailsData.paymentUrl = details.get("payment_url");
    const merchantData = details.get("merchant_data");
    detailsData.merchantData = merchantData && merchantData.toString();
    detailsData.requiredFeeRate = details.get("required_fee_rate");

    let tokenId = null;
    let opReturnScript = null;
    // Parse outputs as number amount and hex string script
    detailsData.outputs = details
      .get("outputs")
      .map((output: any, idx: number): OutputInfo => {
        let tokenAmount = null;
        // if first output has SLP script, go to SLP flow.  Otherwise, BCH flow.
        const script = output.script.toString("hex");
        if (idx === 0) {
          const txOut = {
            vout: idx,
            tx: {
              vout: [
                {
                  scriptPubKey: {
                    hex: script
                  }
                }
              ]
            }
          };
          try {
            const scriptDecoded = decodeTxOut(txOut);
            if (scriptDecoded.token) {
              opReturnScript = script;
              tokenId = scriptDecoded.token;
            }
          } catch (e) {
            if (
              e.message === "Not an OP_RETURN" ||
              e.message === "Not an SLP OP_RETURN"
            ) {
              // ignore, expected for BCH payment requests
            } else {
              console.warn(e);
            }
          }
        }

        if (tokenId) {
          const txOut = {
            vout: idx,
            tx: {
              vout: [
                {
                  scriptPubKey: {
                    hex: opReturnScript
                  }
                }
              ]
            }
          };
          const scriptDecoded = decodeTxOut(txOut);
          tokenAmount = new BigNumber(
            idx === 0 ? 0 : scriptDecoded.quantity.toNumber()
          );
        }

        return {
          amount: new BigNumber(output.amount.toNumber()),
          script: output.script.toString("hex"),
          tokenId,
          tokenAmount
        };
      });

    // Calculate total output value and token amount
    let totalValue = new BigNumber(0);
    let totalTokenAmount = new BigNumber(0);
    for (const output of detailsData.outputs) {
      totalValue = totalValue.plus(output.amount);
      totalTokenAmount = totalTokenAmount.plus(
        output.tokenAmount ? output.tokenAmount : 0
      );
    }
    detailsData.totalValue = totalValue;
    detailsData.tokenId = tokenId;
    detailsData.totalTokenAmount = totalTokenAmount;

    return detailsData;
  } catch (ex) {
    console.warn(ex);
    throw ex;
  }
};
const signAndPublishPaymentRequestTransaction = async (
  paymentRequest: PaymentRequest,
  fromAddress: string,
  refundKeypair: ECPair,
  spendableUtxos: UTXO[]
) => {
  const from = fromAddress;

  const satoshisToSend = parseInt(paymentRequest.totalValue, 10);

  if (!spendableUtxos || spendableUtxos.length === 0) {
    throw new Error("Insufficient funds");
  }

  // Calculate fee
  let byteCount = 0;
  const sortedSpendableUtxos = spendableUtxos.sort((a, b) => {
    return b.satoshis - a.satoshis;
  });
  const inputUtxos = [];
  let totalUtxoAmount = 0;
  const transactionBuilder = new SLP.TransactionBuilder("mainnet");

  let opReturnLength = null;
  if (
    paymentRequest.outputs[0].amount.eq(0) &&
    !paymentRequest.outputs[0].tokenAmount
  ) {
    const asBuffer = Buffer.from(paymentRequest.outputs[0].script, "hex");
    opReturnLength = asBuffer.length;

    console.log("OP RETURN calculatued");
    console.log(opReturnLength);
  }

  for (const utxo of sortedSpendableUtxos) {
    if (utxo.spendable !== true) {
      throw new Error("Cannot spend unspendable utxo");
    }
    transactionBuilder.addInput(utxo.txid, utxo.vout);
    totalUtxoAmount += utxo.satoshis;
    inputUtxos.push(utxo);

    byteCount = SLP.BitcoinCash.getByteCount(
      { P2PKH: inputUtxos.length },
      { P2PKH: paymentRequest.outputs.length + 1 }
    );

    if (opReturnLength) {
      byteCount += opReturnLength;
    }

    // byteCount += opReturnLength;

    if (totalUtxoAmount >= byteCount + satoshisToSend) {
      break;
    }
  }

  const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

  // Verify sufficient fee
  if (satoshisRemaining < 0) {
    throw new Error(
      "Not enough Bitcoin Cash for fee. Deposit a small amount and try again."
    );
  }

  // Destination outputs
  for (const output of paymentRequest.outputs) {
    transactionBuilder.addOutput(
      Buffer.from(output.script, "hex"),
      output.amount.toNumber()
    );
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

  // send the payment transaction
  var payment = new PaymentProtocol().makePayment();
  paymentRequest.merchantData &&
    payment.set(
      "merchant_data",
      Buffer.from(paymentRequest.merchantData, "utf-8")
    );

  payment.set("transactions", [Buffer.from(hex, "hex")]);

  // calculate refund script pubkey
  const refundPubkey = SLP.ECPair.toPublicKey(refundKeypair);
  const refundHash160 = SLP.Crypto.hash160(Buffer.from(refundPubkey));
  const refundScriptPubkey = SLP.Script.pubKeyHash.output.encode(
    Buffer.from(refundHash160, "hex")
  );

  // define the refund outputs
  var refundOutputs = [];
  var refundOutput = new PaymentProtocol().makeOutput();
  refundOutput.set("amount", 0);
  refundOutput.set("script", refundScriptPubkey);
  refundOutputs.push(refundOutput.message);
  payment.set("refund_to", refundOutputs);
  payment.set("memo", paymentRequest.memo);

  // serialize and send
  const rawbody = payment.serialize();
  const headers = {
    Accept:
      "application/bitcoincash-paymentrequest, application/bitcoincash-paymentack",
    "Content-Type": "application/bitcoincash-payment",
    "Content-Transfer-Encoding": "binary"
  };

  // POST payment
  const rawPaymentResponse = await postAsArrayBuffer(
    paymentRequest.paymentUrl,
    headers,
    rawbody
  );

  return rawPaymentResponse;
};

const signAndPublishPaymentRequestTransactionSLP = async (
  paymentRequest: PaymentRequest,
  tokenChangeAddress: string,
  bchChangeAddress: string,
  tokenMetadata: { decimals: number },
  spendableUTxos: UTXO[],
  spendableTokenUtxos: UTXO[]
) => {
  const { outputs, merchantData } = paymentRequest;

  let to: { address: string, tokenAmount: string }[] = [];
  for (let i = 1; i < outputs.length; i++) {
    const toAddress = SLP.Address.fromOutputScript(
      Buffer.from(outputs[i].script, "hex")
    );

    const toAmount = outputs[i].tokenAmount;

    to = [...to, { address: toAddress, tokenAmount: toAmount }];
  }

  const tokenDecimals = tokenMetadata.decimals;
  const scaledTokenSendAmount = new BigNumber(
    paymentRequest.totalTokenAmount
  ).decimalPlaces(tokenDecimals);

  if (scaledTokenSendAmount.lt(1)) {
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

    if (tokenBalance.gte(scaledTokenSendAmount)) {
      break;
    }
  }

  if (!tokenBalance.gte(scaledTokenSendAmount)) {
    throw new Error("Insufficient tokens");
  }

  const tokenChangeAmount = tokenBalance.minus(scaledTokenSendAmount);

  if (tokenChangeAmount.isGreaterThan(0)) {
    to = [
      ...to,
      { address: tokenChangeAddress, tokenAmount: tokenChangeAmount }
    ];
  }

  const sendOpReturn = slpjs.Slp.buildSendOpReturn({
    tokenIdHex: paymentRequest.tokenId,
    outputQtyArray: to.map(toInfo => toInfo.tokenAmount)
  });

  let byteCount = 0;
  let inputSatoshis = 0;
  const inputUtxos = tokenUtxosToSpend;
  for (const utxo of spendableUTxos) {
    inputSatoshis = inputSatoshis + utxo.satoshis;
    inputUtxos.push(utxo);

    byteCount = SLPJS.calculateSendCost(
      sendOpReturn.length,
      inputUtxos.length,
      to.length + 1, // +1 to receive remaining BCH
      tokenChangeAddress
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
  for (let toOutput of to) {
    transactionBuilder.addOutput(toOutput.address, 546);
  }

  // Return remaining bch balance output
  transactionBuilder.addOutput(bchChangeAddress, satoshisRemaining + 546);

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

  const payment = new PaymentProtocol().makePayment();
  payment.set(
    "merchant_data",
    Buffer.from(paymentRequest.merchantData, "utf-8")
  );
  payment.set("transactions", [Buffer.from(hex, "hex")]);

  // calculate refund script pubkey from change address
  const addressType = SLP.Address.detectAddressType(tokenChangeAddress);
  const addressFormat = SLP.Address.detectAddressFormat(tokenChangeAddress);
  let refundHash160 = SLP.Address.cashToHash160(tokenChangeAddress);
  let encodingFunc = SLP.Script.pubKeyHash.output.encode;
  if (addressType === "p2sh") {
    encodingFunc = SLP.Script.scriptHash.output.encode;
  }
  if (addressFormat === "legacy") {
    refundHash160 = SLP.Address.legacyToHash160(tokenChangeAddress);
  }
  const refundScriptPubkey = encodingFunc(Buffer.from(refundHash160, "hex"));

  // define the refund outputs
  var refundOutputs = [];
  var refundOutput = new PaymentProtocol().makeOutput();
  refundOutput.set("amount", 0);
  refundOutput.set("script", refundScriptPubkey);
  refundOutputs.push(refundOutput.message);
  payment.set("refund_to", refundOutputs);
  payment.set("memo", "");

  // serialize and send
  const rawbody = payment.serialize();
  const headers = {
    Accept:
      "application/simpleledger-paymentrequest, application/simpleledger-paymentack",
    "Content-Type": "application/simpleledger-payment",
    "Content-Transfer-Encoding": "binary"
  };

  // POST payment
  const rawPaymentResponse = await postAsArrayBuffer(
    paymentRequest.paymentUrl,
    headers,
    rawbody
  );

  return rawPaymentResponse;
};

export {
  signAndPublishPaymentRequestTransaction,
  signAndPublishPaymentRequestTransactionSLP,
  decodePaymentResponse,
  decodePaymentRequest,
  getAsArrayBuffer,
  txidFromHex
};
