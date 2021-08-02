import PaymentProtocol from "bitcore-payment-protocol";
import BigNumber from "bignumber.js";

import bcoin from "bcash";
import bcrypto from "bcrypto";
import { TokenType1 } from "slp-mdm";
import { UTXO } from "../data/utxos/reducer";
import { decodeTxOut, getByteCount } from "./transaction-utils";

export type PaymentRequest = {
  expires: number;
  memo: string;
  merchantData?: string | object | null;
  network: string;
  outputs: OutputInfo[];
  paymentUrl: string;
  requiredFeeRate?: number | null;
  time: number;
  tokenId?: string | null;
  totalValue: BigNumber;
  totalTokenAmount?: BigNumber | null;
  verified: boolean;
};

export type MerchantData = {
  fiat_symbol: string;
  fiat_rate: number;
  fiat_amount: number;
};

export type OutputInfo = {
  amount: BigNumber;
  script: string;
  tokenId?: string | null;
  tokenAmount?: BigNumber | null;
};

const postAsArrayBuffer = (
  url: string,
  headers: {
    Accept: string;
    "Content-Type": string;
    "Content-Transfer-Encoding": string;
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
  headers: {
    Accept: string;
    "Content-Type": string;
  }
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

const txidFromHex = (hex: string) => {
  const buffer = Buffer.from(hex, "hex");
  const hash = bcrypto.Hash256.digest(buffer).toString("hex");
  const txid = hash
    .match(/[a-fA-F0-9]{2}/g)
    .reverse()
    .join("");
  return txid;
};

const BNToInt64BE = (bn: BigNumber): Buffer => {
  if (!bn.isInteger()) {
    throw new Error("bn not an integer");
  }

  if (!bn.isPositive()) {
    throw new Error("bn not positive integer");
  }

  const h = bn.toString(16);
  if (h.length > 16) {
    throw new Error("bn outside of range");
  }

  return Buffer.from(h.padStart(16, "0"), "hex");
};

const appendOptionalOutput = (
  output: object,
  pr: PaymentRequest,
  tokenMetadata: object | null = null
) => {
  const baseTokenAmount = output.amount * 10 ** tokenMetadata.decimals;
  const outInfo: OutputInfo = {
    script: output.script,
    amount: new BigNumber(baseTokenAmount),
    tokenAmount: null,
    tokenId: null
  };
  // handle SLP
  if (pr.tokenId) {
    outInfo.amount = new BigNumber(546);
    outInfo.tokenId = pr.tokenId;
    outInfo.tokenAmount = new BigNumber(baseTokenAmount);
    // Add output to OP_RETURN
    const opRetBuf = Buffer.from(pr.outputs[0].script, "hex");
    const concatBuf = Buffer.concat([
      opRetBuf,
      BNToInt64BE(outInfo.tokenAmount)
    ]);
    pr.outputs[0].script = concatBuf.toString("hex");
    // Increase totalTokenAmount
    pr.totalTokenAmount = pr.totalTokenAmount.plus(
      outInfo.tokenAmount ? outInfo.tokenAmount : 0
    );
  }
  pr.outputs.push(outInfo);
  pr.totalValue = pr.totalValue.plus(outInfo.amount);
  return pr;
};

const decodePaymentResponse = async (responseData: any) => {
  const buffer = await Buffer.from(responseData);

  // Inspired by Badger extension
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
    return {
      responsePayment,
      responseAck
    };
  } catch (ex) {
    throw ex;
  }
};

const decodePaymentRequest = async (
  requestData: any
): Promise<PaymentRequest> => {
  const buffer = await Buffer.from(requestData);

  try {
    // Get the payment details
    const body = PaymentProtocol.PaymentRequest.decode(buffer);

    const request = new PaymentProtocol().makePaymentRequest(body);
    const detailsData = {} as PaymentRequest;

    let serializedDetails = request.get("serialized_payment_details");
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
      // Verify request is not yet expired
      throw new Error("Request could not be verified");
    }

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

    detailsData.expires = details.get("expires");
    if (detailsData.expires < currentUnixTime) {
      throw new Error("Payment request expired");
    }

    // Get memo, paymentUrl, merchantData and requiredFeeRate
    detailsData.memo = details.get("memo");
    detailsData.paymentUrl = details.get("payment_url");

    const merchantData = details.get("merchant_data");
    detailsData.merchantData = merchantData && merchantData.toString();
    try {
      detailsData.merchantData = JSON.parse(detailsData.merchantData);
    } catch (e) {}
    detailsData.requiredFeeRate = details.get("required_fee_rate");

    let tokenId: string | null = null;
    let opReturnScript: string | null = null;

    // Parse outputs as number amount and hex string script
    detailsData.outputs = details.get("outputs").map(
      (output: any, idx: number): OutputInfo => {
        let tokenAmount = null;
        const script = output.script.toString("hex");

        // if first output has SLP script, go to SLP flow.  Otherwise, BCH flow.
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
          } as UTXO;

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
            } else {
              // ignore, expected for BCH payment requests
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
          } as UTXO;

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
      }
    );

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
  refundKeypair: typeof bcoin.KeyRing,
  spendableUtxos: UTXO[]
) => {
  const from = fromAddress;
  const satoshisToSend = paymentRequest.totalValue.toNumber();

  if (!spendableUtxos || spendableUtxos.length === 0) {
    throw new Error("Insufficient funds");
  }

  let byteCount = 0;
  const sortedSpendableUtxos = spendableUtxos.sort((a, b) => {
    return b.satoshis - a.satoshis;
  });
  const inputUtxos = [];
  let totalUtxoAmount = 0;
  const transactionBuilder = new bcoin.MTX();

  let opReturnLength = null;

  // Add OP return length if present and not a token payment
  if (
    paymentRequest.outputs[0].amount.eq(0) &&
    !paymentRequest.outputs[0].tokenAmount
  ) {
    opReturnLength = Buffer.byteLength(paymentRequest.outputs[0].script, "hex");
  }

  // Calculate fee
  for (const utxo of sortedSpendableUtxos) {
    if (utxo.spendable !== true) {
      throw new Error("Cannot spend unspendable utxo");
    }

    const coin = new bcoin.Coin({
      hash: Buffer.from(utxo.txid, "hex").reverse(), // must reverse bytes
      index: utxo.vout,
      script: Buffer.from(utxo.tx.vout[utxo.vout].scriptPubKey.hex, "hex"),
      value: utxo.satoshis,
      height: utxo.height
    });

    transactionBuilder.addCoin(coin);

    totalUtxoAmount += utxo.satoshis;
    inputUtxos.push(utxo);
    byteCount = getByteCount(
      { P2PKH: inputUtxos.length },
      { P2PKH: paymentRequest.outputs.length + 1 }
    );

    if (opReturnLength) {
      byteCount += opReturnLength;
    }

    if (totalUtxoAmount >= byteCount + satoshisToSend) {
      break;
    }
  }

  // POST payment
  const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

  // Verify sufficient fee
  if (satoshisRemaining < 0) {
    throw new Error(
      "Not enough Bitcoin Cash for transaction fee. Deposit a small amount and try again."
    );
  }

  // Destination outputs
  for (const output of paymentRequest.outputs) {
    transactionBuilder.addOutput(
      bcoin.Script.fromRaw(output.script, "hex"),
      output.amount.toNumber()
    );
  }

  // Return remaining balance output
  if (satoshisRemaining >= 546) {
    transactionBuilder.addOutput(
      bcoin.Address.fromString(from),
      satoshisRemaining
    );
  }

  // let redeemScript: any;
  // inputUtxos.forEach((utxo, index) => {
  //   utxo.keypair &&
  //     transactionBuilder.sign(
  //       index,
  //       utxo.keypair,
  //       redeemScript,
  //       transactionBuilder.hashTypes.SIGHASH_ALL,
  //       utxo.satoshis
  //     );
  // });
  transactionBuilder.sign(inputUtxos[0].keypair);
  const hex = transactionBuilder.toRaw().toString("hex");

  // send the payment transaction
  let payment = new PaymentProtocol().makePayment();

  payment.set("merchant_data", Buffer.from("", "utf-8"));
  payment.set("transactions", [Buffer.from(hex, "hex")]);

  // calculate refund script pubkey
  const refundScriptPubkey = bcoin.Script.fromAddress(
    refundKeypair.getKeyAddress()
  ).toRaw();

  // define the refund outputs
  let refundOutputs = [];
  let refundOutput = new PaymentProtocol().makeOutput();
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
  tokenMetadata: {
    decimals: number | null;
  },
  spendableUtxos: UTXO[],
  spendableTokenUtxos: UTXO[]
) => {
  if (!tokenMetadata.decimals) {
    throw new Error("Error getting SLP token metadata, transaction cancelled");
  }

  const { outputs, merchantData } = paymentRequest;
  let to: {
    address: string;
    tokenAmount?: BigNumber | null;
  }[] = [];

  for (let i = 1; i < outputs.length; i++) {
    const outScript = bcoin.Script.fromRaw(outputs[i].script, "hex");
    const toAddress = outScript.getAddress().toString();
    const toAmount = outputs[i].tokenAmount;
    to = [
      ...to,
      {
        address: toAddress,
        tokenAmount: toAmount
      }
    ];
  }

  const tokenDecimals = tokenMetadata.decimals;
  const scaledTokenSendAmount = new BigNumber(
    paymentRequest.totalTokenAmount || 0
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

  // Verify sufficient tokens
  if (!tokenBalance.gte(scaledTokenSendAmount)) {
    throw new Error("Insufficient tokens");
  }
  const tokenChangeAmount = tokenBalance.minus(scaledTokenSendAmount);

  if (tokenChangeAmount.isGreaterThan(0)) {
    to = [
      ...to,
      {
        address: tokenChangeAddress,
        tokenAmount: tokenChangeAmount
      }
    ];
  }

  const sendOpReturn = TokenType1.send(
    paymentRequest.tokenId,
    to.map(toInfo => toInfo.tokenAmount)
  );
  let byteCount = 0;
  let inputSatoshis = 0;
  const inputUtxos = tokenUtxosToSpend;

  // Is Postage Paid by Merchant?
  let postagePaid = false;
  if (typeof merchantData === "object" && merchantData.postage) {
    let stamps = merchantData.postage.stamps;
    let listing = stamps.find(stamp => stamp.tokenId == paymentRequest.tokenId);
    if (listing && listing.rate == 0) {
      postagePaid = true;
    }
  }

  if (!postagePaid) {
    for (const utxo of spendableUtxos) {
      inputSatoshis = inputSatoshis + utxo.satoshis;
      inputUtxos.push(utxo);
      byteCount = getByteCount(
        { P2PKH: inputUtxos.length },
        { P2PKH: to.length + 1 }
      );

      byteCount += sendOpReturn.length;
      byteCount += 546 * (to.length + 1); // dust for SLP outputs

      if (inputSatoshis >= byteCount) {
        break;
      }
    }
  }

  const transactionBuilder = new bcoin.MTX();
  let totalUtxoAmount = 0;

  inputUtxos.forEach(utxo => {
    const coin = new bcoin.Coin({
      hash: Buffer.from(utxo.txid, "hex").reverse(), // must reverse bytes
      index: utxo.vout,
      script: Buffer.from(utxo.tx.vout[utxo.vout].scriptPubKey.hex, "hex"),
      value: utxo.satoshis,
      height: utxo.height
    });

    transactionBuilder.addCoin(coin);

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
  transactionBuilder.addOutput(bcoin.Script.fromRaw(sendOpReturn), 0);
  // Token destination output
  for (let toOutput of to) {
    transactionBuilder.addOutput(
      bcoin.Address.fromString(toOutput.address),
      546
    );
  }

  if (!postagePaid && satoshisRemaining >= 546) {
    // Return remaining bch balance output
    transactionBuilder.addOutput(
      bcoin.Address.fromString(bchChangeAddress),
      satoshisRemaining
    );
  }

  const hashTypes = bcoin.script.common.hashType;
  const sighashType = postagePaid
    ? hashTypes.ALL | hashTypes.ANYONECANPAY
    : hashTypes.ALL;

  // const sigHash = transactionBuilder.hashTypes.SIGHASH_ALL;

  // let redeemScript: any;
  // inputUtxos.forEach((utxo, index) => {
  //   transactionBuilder.sign(
  //     index,
  //     utxo.keypair,
  //     redeemScript,
  //     postagePaid
  //       ? sigHash | transactionBuilder.hashTypes.SIGHASH_ANYONECANPAY
  //       : sigHash,
  //     utxo.satoshis
  //   );
  // });
  // const hex = transactionBuilder.build().toHex();

  transactionBuilder.sign(spendableTokenUtxos[0].keypair, sighashType);
  transactionBuilder.sign(spendableUtxos[0].keypair, sighashType);
  const hex = transactionBuilder.toRaw().toString("hex");

  const payment = new PaymentProtocol().makePayment();
  payment.set("merchant_data", Buffer.from("", "utf-8"));
  payment.set("transactions", [Buffer.from(hex, "hex")]);

  const tokenChangeAddr = bcoin.Address.fromString(tokenChangeAddress);

  // calculate refund script pubkey from change address
  const refundScriptPubkey = bcoin.Script.fromAddress(tokenChangeAddr).toRaw();
  var refundOutputs = [];
  var refundOutput = new PaymentProtocol().makeOutput();

  // define the refund outputs
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
  postAsArrayBuffer,
  getAsArrayBuffer,
  txidFromHex,
  appendOptionalOutput
};
