// @flow

// TODO:  Consider moving the contents of this file in to `transaction-utils`

import { SLP } from "./slp-sdk-utils";

import PaymentProtocol from "bitcore-payment-protocol";
// import toBuffer from "blob-to-buffer";

import { type TxParams } from "./transaction-utils";
import { type ECPair } from "../data/accounts/reducer";
import { type UTXO } from "../data/utxos/reducer";

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
  /* Use the await keyword to wait for the Promise to resolve */
  buffer = await new Response(responseData).arrayBuffer(); //: ArrayBuffer

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

const signAndPublishPaymentRequestTransaction = async (
  txParams: TxParams,
  keyPair: ECPair,
  spendableUtxos: UTXO[]
) => {
  // return new Promise(async (resolve, reject) => {
  // try {
  const from = txParams.from;
  const satoshisToSend = parseInt(txParams.value);

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
  for (const utxo of sortedSpendableUtxos) {
    if (utxo.spendable !== true) {
      throw new Error("Cannot spend unspendable utxo");
    }
    transactionBuilder.addInput(utxo.txid, utxo.vout);
    totalUtxoAmount += utxo.satoshis;
    inputUtxos.push(utxo);

    byteCount = SLP.BitcoinCash.getByteCount(
      { P2PKH: inputUtxos.length },
      { P2PKH: txParams.paymentData.outputs.length + 1 }
    );

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
  for (const output of txParams.paymentData.outputs) {
    transactionBuilder.addOutput(
      Buffer.from(output.script, "hex"),
      output.amount
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
      utxo.keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      utxo.satoshis
    );
  });

  const hex = transactionBuilder.build().toHex();

  // send the payment transaction
  var payment = new PaymentProtocol().makePayment();
  payment.set(
    "merchant_data",
    Buffer.from(txParams.paymentData.merchantData, "utf-8")
  );
  payment.set("transactions", [Buffer.from(hex, "hex")]);

  // calculate refund script pubkey
  const refundPubkey = SLP.ECPair.toPublicKey(keyPair); // ? figure out how the refund part works?
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
  payment.set("memo", "");

  // serialize and send
  const rawbody = payment.serialize();
  const headers = {
    Accept:
      "application/bitcoincash-paymentrequest, application/bitcoincash-paymentack",
    "Content-Type": "application/bitcoincash-payment",
    "Content-Transfer-Encoding": "binary"
  };

  // change to fetch
  const response = await fetch(txParams.paymentData.paymentUrl, {
    method: "POST",
    body: rawbody,
    headers,
    responsetype: "blob"
  });

  const responseTxHex = await decodePaymentResponse(response.data);
  const txid = txidFromHex(responseTxHex);

  return txid;

  // resolve(txid)
  // } catch (err) {
  //   reject(err)
  // }
  // }
};

// From Badger extension
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

  let buffer = await Buffer.from(requestData); //requestData.text(); //await Buffer.from(requestData, 'base64');
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

export {
  signAndPublishPaymentRequestTransaction,
  decodePaymentResponse,
  decodePaymentRequest
};
