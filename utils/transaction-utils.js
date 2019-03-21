// @flow

import SLPSDK from "slp-sdk";
import BigNumber from "big-number";
import slpjs from "slpjs";

const SLP = new SLPSDK();

const getAllUtxo = async (address: string) => {
  const result = await SLP.address.utxo(address);
  return result.utxos;
};

const getLargestUtxo = async (address: string) => {
  const result = await SLP.address.utxo(address);
  try {
    const utxo = result.utxos.sort((a, b) => {
      return a.satoshis - b.satoshis;
    })[result.utxos.length - 1];
    return utxo;
  } catch (err) {
    throw err;
  }
};

const getTransactionDetails = async (txid: string) => {
  try {
    const result = await SLP.Transaction.details(txid);
    return result;
  } catch (e) {
    throw e;
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
  return SLP.Script.encode(script);
};

const publishTx = async hex => {
  const result = await SLP.RawTransactions.sendRawTransaction(hex);
  try {
    if (result[0].length == 64) {
      return result[0];
    }
    throw new Error(`Transaction Failed: ${result}`);
  } catch (e) {
    throw e;
  }
};

const signAndPublishBchTransaction = async (
  txParams,
  keyPair,
  spendableUtxos
) => {
  const from = txParams.from;
  const to = txParams.to;
  const satoshisToSend = parseInt(txParams.value, 10);

  if (!spendableUtxos || spendableUtxos.length === 0) {
    throw new Error("Insufficient funds");
  }

  let byteCount = SLP.BitcoinCash.getByteCount(
    { P2PKH: spendableUtxos.length },
    { P2PKH: 2 }
  );
  if (txParams.opReturn) {
    byteCount += this.encodeOpReturn(txParams.opReturn.data).byteLength + 10;
  }

  const transactionBuilder = new SLP.TransactionBuilder("mainnet");

  let totalUtxoAmount = 0;

  spendableUtxos.forEach(utxo => {
    if (utxo.spendable !== true) {
      throw new Error("Cannot spend unspendable utxo");
    }
    transactionBuilder.addInput(utxo.txid, utxo.vout);
    totalUtxoAmount += utxo.satoshis;
  });

  const satoshisRemaining = totalUtxoAmount - byteCount - satoshisToSend;

  // Destination output
  transactionBuilder.addOutput(to, satoshisToSend);

  // Op Return
  // TODO: Allow dev to pass in "position" property for vout of opReturn
  if (txParams.opReturn) {
    const encodedOpReturn = this.encodeOpReturn(txParams.opReturn.data);
    transactionBuilder.addOutput(encodedOpReturn, 0);
  }

  // Return remaining balance output
  if (satoshisRemaining >= 546) {
    transactionBuilder.addOutput(from, satoshisRemaining);
  }

  let redeemScript;
  spendableUtxos.forEach((utxo, index) => {
    transactionBuilder.sign(
      index,
      keyPair,
      redeemScript,
      transactionBuilder.hashTypes.SIGHASH_ALL,
      utxo.satoshis
    );
  });

  const hex = transactionBuilder.build().toHex();

  // TODO: Handle failures: transaction already in blockchain, mempool length, networking
  const txid = await this.publishTx(hex);
  return txid;
};

const signAndPublishSlpTransaction = async (
  txParams,
  keyPair,
  spendableUtxos,
  tokenMetadata,
  spendableTokenUtxos
) => {
  const from = txParams.from;
  const to = txParams.to;
  const tokenDecimals = tokenMetadata.decimals;
  const scaledTokenSendAmount = new BigNumber(txParams.value).decimalPlaces(
    tokenDecimals
  );
  const tokenSendAmount = scaledTokenSendAmount.times(10 ** tokenDecimals);

  let tokenBalance = new BigNumber(0);
  for (const tokenUtxo of spendableTokenUtxos) {
    const utxoBalance = tokenUtxo.slp.quantity;
    tokenBalance = tokenBalance.plus(utxoBalance);
  }

  if (!tokenBalance.gte(tokenSendAmount)) {
    throw new Error("Insufficient tokens");
  }

  const tokenChangeAmount = tokenBalance.minus(tokenSendAmount);

  const sendOpReturn = slpjs.slp.buildSendOpReturn({
    tokenIdHex: txParams.sendTokenData.tokenId,
    outputQtyArray: [tokenSendAmount, tokenChangeAmount]
  });

  const inputUtxos = spendableUtxos.concat(spendableTokenUtxos);

  const tokenReceiverAddressArray = [to, from];

  const transactionBuilder = new SLP.TransactionBuilder("mainnet");

  let totalUtxoAmount = 0;
  inputUtxos.forEach(utxo => {
    transactionBuilder.addInput(utxo.txid, utxo.vout);
    totalUtxoAmount += utxo.satoshis;
  });

  const byteCount = slpjs.slp.calculateSendCost(
    sendOpReturn.length,
    inputUtxos.length,
    tokenReceiverAddressArray.length + 1, // +1 to receive remaining BCH
    from
  );

  const satoshisRemaining = totalUtxoAmount - byteCount;

  // SLP data output
  transactionBuilder.addOutput(sendOpReturn, 0);

  // Token destination output
  transactionBuilder.addOutput(to, 546);

  // Return remaining token balance output
  transactionBuilder.addOutput(from, 546);

  // Return remaining bch balance output
  transactionBuilder.addOutput(from, satoshisRemaining + 546);

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

  const txid = await this.publishTx(hex);
  return txid;
};

export { getLargestUtxo, getAllUtxo };
