// @flow

// TODO:  Consider moving the contents of this file in to `transaction-utils`

import { SLP } from "./slp-sdk-utils";

import PaymentProtocol from "bitcore-payment-protocol";
// import toBuffer from "blob-to-buffer";

import { type TxParams } from "./transaction-utils";
import { type ECPair } from "../data/accounts/reducer";
import { type UTXO } from "../data/utxos/reducer";

export type PaymentRequest = {
  expires: number,
  memo: string,
  merchantData: string, //"{"fiat_symbol":"BCH","fiat_rate":1,"fiat_amount":0.00005}"
  network: string,
  outputs: { amount: number, script: string }[],
  paymentUrl: string,
  requiredFeeRate: ?number,
  time: number,
  totalValue: number,
  verified: boolean
};

export type MerchantData = {
  fiat_symbol: string,
  fiat_rate: number,
  fiat_amount: number
};

const getAsArrayBuffer = (
  url: string,
  headers: { Accept: string, "Content-Type": string }
): Promise<any> => {
  return new Promise((accept, reject) => {
    let req = new XMLHttpRequest();

    console.log("r1");
    req.open("GET", url, true);
    Object.entries(headers).forEach(([key, value]) => {
      req.setRequestHeader(key, value);
    });

    console.log("r2");

    req.responseType = "arraybuffer";

    req.onload = function(event) {
      console.log("r4");
      let resp = req.response;
      if (resp) {
        console.log("r5");
        accept(resp);
      }
    };
    req.onerror = function(err) {
      console.log("re");
      console.log(err);
      reject(err);
    };

    console.log("r3");
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
  let buffer = null;
  console.log("DECODE PAYMENT DETAILS START-- ------- - ---- ----- -- ---");
  console.log(responseData);

  const buffer = await Buffer.from(responseData);

  try {
    const responseBody = PaymentProtocol.PaymentACK.decode(buffer);
    const responseAck = new PaymentProtocol().makePaymentACK(responseBody);
    const responseSerializedPayment = responseAck.get("payment");
    const responseDecodedPayment = PaymentProtocol.Payment.decode(
      responseSerializedPayment
    );
    const responsePayment = new PaymentProtocol().makePayment(
      responseDecodedPayment
    );
    const txHex = responsePayment.message.transactions[0].toHex();

    console.log("DECODE PAYMENT DETAILS-- ------- - ---- ----- -- ---");
    console.log(responseDecodedPayment);
    console.log(responseDecodedPayment);
    return txHex;
    // resolve(txHex);
  } catch (ex) {
    throw ex;
    // reject(ex);
  }

  // blob-to-buffer
  // return new Promise((resolve, reject) => {
  //   // toBuffer(responseData, function(err, buffer) {
  //     // if (err) reject(err);

  //     try {
  //       const responseBody = PaymentProtocol.PaymentACK.decode(buffer);
  //       const responseAck = new PaymentProtocol().makePaymentACK(responseBody);
  //       const responseSerializedPayment = responseAck.get("payment");
  //       const responseDecodedPayment = PaymentProtocol.Payment.decode(
  //         responseSerializedPayment
  //       );
  //       const responsePayment = new PaymentProtocol().makePayment(
  //         responseDecodedPayment
  //       );
  //       const txHex = responsePayment.message.transactions[0].toHex();
  //       resolve(txHex);
  //     } catch (ex) {
  //       reject(ex);
  //     }
  //   });
  // });
};

// Inspired by Badger extension
const decodePaymentRequest = async requestData => {
  // let buffer = null;
  // console.log("hmmm?");
  // /* Use the await keyword to wait for the Promise to resolve */
  // try {
  //   buffer = await new Response(requestData).arrayBuffer(); //: ArrayBuffer
  // } catch (e) {
  //   console.log("CAUGHT");
  //   console.log(e);
  // }
  console.log("before");
  console.log(requestData);

  const buffer = await Buffer.from(requestData); //requestData.text(); //await Buffer.from(requestData, 'base64');
  console.log(buffer);

  // console.log("test?");
  // console.log(buffer);

  // return new Promise((resolve, reject) => {
  //   toBuffer(requestData, function(err, buffer) {
  // if (err) reject(err);

  try {
    console.log("1");
    let body = PaymentProtocol.PaymentRequest.decode(buffer);
    console.log("2?");
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
    var decodedDetails = PaymentProtocol.PaymentDetails.decode(
      serializedDetails
    );
    var details = new PaymentProtocol().makePaymentDetails(decodedDetails);

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
    detailsData.merchantData = merchantData.toString();
    detailsData.requiredFeeRate = details.get("required_fee_rate");

    // Parse outputs as number amount and hex string script
    detailsData.outputs = details.get("outputs").map(output => {
      return {
        amount: output.amount.toNumber(),
        script: output.script.toString("hex")
      };
    });

    // Calculate total output value
    let totalValue = 0;
    for (const output of detailsData.outputs) {
      totalValue += output.amount;
    }
    detailsData.totalValue = totalValue;
    return detailsData;
  } catch (ex) {
    throw ex;
  }
  //   });
  // });
};

// from
//  satoshis to send (BigBumber?), why not amount?
// spendable UTXO's
// outputs from paymentData
// paymentURL form paymentData

const signAndPublishPaymentRequestTransaction = async (
  paymentRequest: PaymentRequest,
  fromAddress: string,
  refundKeypair: ECPair,
  spendableUtxos: UTXO[]
) => {
  // return new Promise(async (resolve, reject) => {
  // try {

  console.log("---- 1");
  const from = fromAddress;

  const satoshisToSend = parseInt(paymentRequest.totalValue, 10); // Use this, or calculate when going through outputs...?

  if (!spendableUtxos || spendableUtxos.length === 0) {
    throw new Error("Insufficient funds");
  }

  console.log("---- 2");

  // Calculate fee
  let byteCount = 0;
  const sortedSpendableUtxos = spendableUtxos.sort((a, b) => {
    return b.satoshis - a.satoshis;
  });
  const inputUtxos = [];
  let totalUtxoAmount = 0;
  const transactionBuilder = new SLP.TransactionBuilder("mainnet");

  console.log("---- 3");
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

    if (totalUtxoAmount >= byteCount + satoshisToSend) {
      break;
    }
  }

  console.log("---- 4");

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
      output.amount
    );
  }

  console.log("---- 5");

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

  console.log("---- 6");

  const hex = transactionBuilder.build().toHex();

  console.log("---- 7");

  // send the payment transaction
  var payment = new PaymentProtocol().makePayment();
  payment.set(
    "merchant_data",
    Buffer.from(paymentRequest.merchantData, "utf-8")
  );
  payment.set("transactions", [Buffer.from(hex, "hex")]);

  console.log("---- 8");

  // calculate refund script pubkey
  const refundPubkey = SLP.ECPair.toPublicKey(refundKeypair);
  const refundHash160 = SLP.Crypto.hash160(Buffer.from(refundPubkey));
  const refundScriptPubkey = SLP.Script.pubKeyHash.output.encode(
    Buffer.from(refundHash160, "hex")
  );

  console.log("---- 9");

  // define the refund outputs
  var refundOutputs = [];
  var refundOutput = new PaymentProtocol().makeOutput();
  refundOutput.set("amount", 0);
  refundOutput.set("script", refundScriptPubkey);
  refundOutputs.push(refundOutput.message);
  payment.set("refund_to", refundOutputs);
  payment.set("memo", "");

  console.log("---- 10");

  // serialize and send
  const rawbody = payment.serialize();
  const headers = {
    Accept:
      "application/bitcoincash-paymentrequest, application/bitcoincash-paymentack",
    "Content-Type": "application/bitcoincash-payment",
    "Content-Transfer-Encoding": "binary"
  };

  console.log("---- 11");

  // POST payment
  // change to fetch
  const request = await fetch(paymentRequest.paymentUrl, {
    method: "POST",
    body: rawbody,
    headers
  });
  const response = request.blob();

  console.log("MADE IT TO THE END IT'S A MIRACLE?");
  console.log(response);

  const responseTxHex = await decodePaymentResponse(response.data);
  const txid = txidFromHex(responseTxHex);

  console.log("end end");
  console.log(txid);

  return txid;

  // resolve(txid)
  // } catch (err) {
  //   reject(err)
  // }
  // }
};

export {
  signAndPublishPaymentRequestTransaction,
  decodePaymentResponse,
  decodePaymentRequest,
  getAsArrayBuffer
};
