import bcoin from "bcash";
const bchaddr = require("bchaddrjs-slp");
const bchrpc = require("grpc-bchrpc-web");
const ReactNativeTransport = require("@improbable-eng/grpc-web-react-native-transport")
  .ReactNativeTransport;
const grpcUrl = "https://bchd.fountainhead.cash:443";
const GrpcClient = new bchrpc.GrpcClient({ url: grpcUrl });
GrpcClient.client.options.transport = ReactNativeTransport({
  withCredentials: false
});

export interface UTXOResult {
  txid: string;
  vout: number;
  amount: number;
  satoshis: number;
  height: number;
  tx?: any;
  confirmations?: number;
  scriptPubKey: string;
  legacyAddress?: string;
  cashAddress?: string;
  address?: string;
  validSlpTx?: boolean;
  spendable?: boolean;
  slp?: {
    token: string;
    quantity: string;
    baton: boolean;
  };
  slpToken?: {
    tokenId: string;
    amount: number;
    isMintBaton: boolean;
    address: string;
    decimals: number;
    slpAction: number;
    tokenType: 1;
  };
  tokenMetadata?: {
    tokenId: string;
    tokenTicker: string;
    tokenName: string;
    tokenDocumentUrl: string;
    tokenDocumentHash: string;
    decimals: number;
    mintBatonTxid: string;
    mintBatonVout: number;
  };
}

const base64ToHex = function(
  base64String: string,
  reversedHashOrder: boolean = false
): string {
  const buf = Buffer.from(base64String, "base64");
  return reversedHashOrder
    ? buf.reverse().toString("hex")
    : buf.toString("hex");
};

const base64ToUtf8 = function(base64String: string): string {
  const buf = Buffer.from(base64String, "base64");
  return buf.toString("utf8");
};

const getBlockchainInfo = async (): Promise<{
  bestHeight: number;
  bestBlockHash: string;
  difficulty: number;
  medianTime: number;
  txIndex: boolean;
  addrIndex: boolean;
  slpIndex: boolean;
}> => {
  const blockchainInfo = await GrpcClient.getBlockchainInfo();
  const blockchainInfoObj = blockchainInfo.toObject();
  blockchainInfoObj.bestBlockHash = base64ToHex(
    blockchainInfoObj.bestBlockHash,
    true
  );
  return blockchainInfoObj;
};

const getUtxosByAddress = async function(
  address: string,
  includeTxData: boolean = true
): Promise<UTXOResult[]> {
  const utxosPb = await GrpcClient.getAddressUtxos({
    address: address,
    includeMempool: true,
    includeTokenMetadata: true
  });
  const utxos = utxosPb.toObject().outputsList;
  const outs = [];
  for (let i = 0; i < utxos.length; i++) {
    const value = parseInt(utxos[i].value);
    let utxo = {
      amount: value / 10 ** 8,
      height: utxos[i].blockHeight,
      satoshis: value,
      txid: base64ToHex(utxos[i].outpoint.hash, true),
      vout: parseInt(utxos[i].outpoint.index),
      scriptPubKey: base64ToHex(utxos[i].pubkeyScript)
    };
    if (includeTxData) {
      utxo = await formatUtxo(utxo);
    }
    outs.push(utxo);
  }
  return outs;
};

const getUtxo = async function(
  txhash: string,
  vout: number,
  includeTokenMetadata: boolean = true
): Promise<UTXOResult> {
  const utxoPb = await GrpcClient.getUnspentOutput({
    hash: txhash,
    vout: vout,
    reversedHashOrder: true,
    includeMempool: true,
    includeTokenMetadata: includeTokenMetadata
  });
  let utxo = utxoPb.toObject();
  if (utxo.outpoint) {
    const value = parseInt(utxo.value);
    utxo = {
      amount: value / 10 ** 8,
      height: utxo.blockHeight,
      satoshis: value,
      txid: base64ToHex(utxo.outpoint.hash, true),
      vout: parseInt(utxo.outpoint.index),
      scriptPubKey: base64ToHex(utxo.pubkeyScript)
    };
    utxo = await formatUtxo(utxo);
  }
  return utxo;
};

const formatUtxo = async function(utxo: any): Promise<UTXOResult> {
  const tx = await getTransaction(utxo.txid);
  // Get SLP Info
  let slpToken = tx.transaction.vout[utxo.vout].slpToken;
  if (slpToken) {
    utxo.tokenMetadata = tx.tokenMetadata;
    utxo.slpToken = slpToken;
  }
  const cashAddress = bcoin.Address.fromScript(
    bcoin.Script.fromRaw(utxo.scriptPubKey, "hex")
  ).toString();
  let formattedUtxo = {
    ...utxo,
    ...{
      tx: tx.transaction,
      confirmations: tx.transaction.confirmations,
      legacyAddress: bchaddr.toLegacyAddress(
        cashAddress.replace("bitcoincash:", "")
      ),
      cashAddress: cashAddress,
      address: cashAddress,
      validSlpTx: utxo.slpToken ? true : false,
      spendable: utxo.slpToken ? false : true
    }
  };
  if (slpToken) {
    formattedUtxo = {
      ...formattedUtxo,
      ...{
        slp: {
          token: utxo.slpToken.tokenId,
          quantity: slpToken.amount.toString(),
          baton: slpToken.isMintBaton
        },
        slpToken: utxo.slpToken
      }
    };
  }
  return formattedUtxo;
};

const getTransactions = async function(
  txhashes: string[],
  returnPb: Boolean = false
) {
  let txs = [];
  for (let i = 0; i < txhashes.length; i++) {
    const tx = await getTransaction(txhashes[i], returnPb);
    if (tx) txs.push(tx);
  }
  return txs;
};

const getTransaction = async function(
  txhash: string,
  returnPb: Boolean = false
) {
  const txPb = await GrpcClient.getTransaction({
    hash: txhash,
    reversedHashOrder: true,
    includeTokenMetadata: true
  });
  if (returnPb) return txPb;
  const tx = formatTransaction(txPb.toObject());
  return tx;
};

const formatTransaction = function(tx: any) {
  tx.transaction.hash = base64ToHex(tx.transaction.hash, true);
  tx.transaction.blockHash =
    tx.transaction.blockHash != ""
      ? base64ToHex(tx.transaction.blockHash)
      : null;
  tx.transaction.vin = tx.transaction.inputsList.map(input => {
    const sigScriptHex = base64ToHex(input.signatureScript);
    let inObj = {
      txid: base64ToHex(input.outpoint.hash, true),
      vout: parseInt(input.outpoint.index),
      sequence: input.sequence,
      n: input.index,
      scriptSig: {
        hex: sigScriptHex,
        asm: bcoin.Script.fromRaw(sigScriptHex, "hex").toASM()
      },
      previousScript: base64ToHex(input.previousScript),
      value: input.value,
      legacyAddress: bchaddr.toLegacyAddress(input.address),
      cashAddress: `bitcoincash:${input.address}`
    };
    if (input.slpToken) {
      input.slpToken.tokenId = base64ToHex(input.slpToken.tokenId);
      input.slpToken.amount = parseInt(input.slpToken.amount);
      inObj = {
        ...inObj,
        ...{
          slpToken: input.slpToken
        }
      };
    }
    return inObj;
  });
  tx.transaction.vout = tx.transaction.outputsList.map(output => {
    let scriptPubKeyObj = {
      hex: base64ToHex(output.pubkeyScript),
      asm: output.disassembledScript
    };
    if (output.scriptClass != "datacarrier") {
      scriptPubKeyObj = {
        ...scriptPubKeyObj,
        ...{
          addresses: [bchaddr.toLegacyAddress(output.address)],
          type: output.scriptclass,
          cashAddrs: [output.address]
        }
      };
    }
    let outObj = {
      value: output.value / 10 ** 8,
      satoshis: output.value,
      n: output.index,
      scriptPubKey: scriptPubKeyObj
    };
    if (output.slpToken) {
      output.slpToken.tokenId = base64ToHex(output.slpToken.tokenId);
      output.slpToken.amount = parseInt(output.slpToken.amount);
      outObj = {
        ...outObj,
        ...{
          slpToken: output.slpToken
        }
      };
    }
    return outObj;
  });
  if (tx.transaction.slpTransactionInfo) {
    tx.transaction.slpTransactionInfo.tokenId = base64ToHex(
      tx.transaction.slpTransactionInfo.tokenId
    );
  }
  delete tx.transaction.inputsList;
  delete tx.transaction.outputsList;
  // Set tokenMetadata
  if (tx.tokenMetadata) {
    tx.tokenMetadata.tokenId = base64ToHex(tx.tokenMetadata.tokenId);
    tx.tokenMetadata.type1.tokenTicker = base64ToUtf8(
      tx.tokenMetadata.type1.tokenTicker
    );
    tx.tokenMetadata.type1.tokenName = base64ToUtf8(
      tx.tokenMetadata.type1.tokenName
    );
    tx.tokenMetadata.type1.tokenDucmentUrl = base64ToUtf8(
      tx.tokenMetadata.type1.tokenDocumentUrl
    );
    tx.tokenMetadata.type1.tokenDocumentHash = base64ToHex(
      tx.tokenMetadata.type1.tokenDocumentHash
    );
  }

  return tx;
};

const getTransactionsByAddress = async function(
  address: string,
  height: number,
  limit: number = 30,
  offset: number = 0
) {
  const txPb = await GrpcClient.getAddressTransactions({
    address: address.replace("bitcoincash:", ""),
    height: height,
    nbFetch: limit,
    nbSkip: offset
  });
  // const txs = txPb.toObject();
  const confirmed = txPb.getConfirmedTransactionsList() || [];
  const unconfirmed = txPb.getUnconfirmedTransactionsList() || [];
  const allTxs = [...unconfirmed.map(tx => tx.getTransaction()), ...confirmed];
  return allTxs;
};

const sendTx = async function(
  hex: string,
  log: Boolean = true
): Promise<string> {
  const res = await await GrpcClient.submitTransaction({
    txnHex: hex
  });
  const hash = Buffer.from(res.getHash_asU8().reverse()).toString("hex");
  if (log) console.log("sendTx() res: ", hash);
  return hash;
};

export {
  formatUtxo,
  grpcUrl,
  getBlockchainInfo,
  getUtxo,
  getUtxosByAddress,
  getTransaction,
  getTransactions,
  formatTransaction,
  getTransactionsByAddress,
  sendTx
};
