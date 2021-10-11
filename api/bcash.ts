// Helper methods to communicate with the bcash REST API
import bcoin from "bcash";
const bchaddr = require("bchaddrjs-slp");
import { UTXOResult } from "./grpc";

const API = `https://bcash.badger.cash:8332`;

const getCurrentBlockheight = async () => {
  try {
    const req = await fetch(`${API}/height`);
    const resp = await req.json();
    return resp.height;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

const getTokenData = async (tokenId: string) => {
  try {
    const req = await fetch(`${API}/token/${tokenId}`);
    const resp = await req.json();
    return resp;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

const getUtxosByAddress = async (
  address: string,
  includeTxData: boolean = true
): Promise<UTXOResult[]> => {
  try {
    const req = await fetch(`${API}/coin/address/${address}?slp=true`);
    const utxos = await req.json();
    const outs = [];
    for (let i = 0; i < utxos.length; i++) {
      let utxo = {
        amount: utxos[i].value / 10 ** 8,
        height: utxos[i].blockHeight,
        satoshis: utxos[i].value,
        txid: utxos[i].hash,
        vout: utxos[i].index,
        scriptPubKey: utxos[i].script,
        cashAddress: utxos[i].address
      };
      if (utxos[i].slp) {
        utxo.slp = utxos[i].slp;
      }
      if (includeTxData) {
        utxo = await formatUtxo(utxo);
      }
      outs.push(utxo);
    }
    return outs;
  } catch (e) {
    console.log("utxo fetch error", JSON.stringify(e));
    throw e;
  }
};

const formatUtxo = async function(utxo: any): Promise<UTXOResult> {
  const tx = await getTransaction(utxo.txid);
  // Get SLP Info
  let slpToken = tx.transaction.vout[utxo.vout].slpToken;
  if (slpToken) {
    utxo.slpToken = {
      tokenId: utxo.slp.tokenId,
      amount: utxo.slp.value,
      isMintBaton: utxo.slp.type == "BATON",
      address: utxo.cashAddress,
      decimals: slpToken.decimals,
      slpAction: utxo.slp.type == "SEND" ? 6 : utxo.slp.type == "MINT" ? 5 : 4,
      tokenType: 1
    };
    utxo.tokenMetadata = {
      tokenId: slpToken.tokenId,
      tokenTicker: slpToken.ticker,
      tokenName: slpToken.name,
      tokenDocumentUrl: slpToken.uri,
      tokenDocumentHash: slpToken.hash,
      decimals: slpToken.decimals
    };
    // remove unformatted slp object
    delete utxo.slp;
  }
  let formattedUtxo = {
    ...utxo,
    ...{
      tx: tx.transaction,
      confirmations: tx.transaction.confirmations,
      legacyAddress: bchaddr.toLegacyAddress(
        utxo.cashAddress.replace("bitcoincash:", "")
      ),
      address: utxo.cashAddress,
      validSlpTx: utxo.slp ? true : false,
      spendable: utxo.slp ? false : true
    }
  };
  if (slpToken) {
    formattedUtxo = {
      ...formattedUtxo,
      ...{
        slp: {
          token: utxo.slpToken.tokenId,
          quantity: utxo.slpToken.amount,
          baton: utxo.slpToken.isMintBaton
        },
        slpToken: utxo.slpToken
      }
    };
  }
  return formattedUtxo;
};

const getTransaction = async function(txhash: string) {
  const req = await fetch(`${API}/tx/${txhash}?slp=true`);
  const resp = await req.json();
  const tx = formatTransaction(resp);
  return tx;
};

const formatTransaction = function(transaction: any) {
  let tx = {
    transaction: {},
    tokenMetadata: undefined
  };
  tx.transaction.hash = transaction.hash;
  tx.transaction.confirmations = transaction.confirmations;
  tx.transaction.blockHash = transaction.block;
  tx.transaction.blockHeight = transaction.height;
  tx.transaction.vin = transaction.inputs.map(input => {
    let inObj = {
      txid: input.hash,
      vout: input.index,
      sequence: input.sequence,
      n: input.index,
      scriptSig: {
        hex: input.script,
        asm: bcoin.Script.fromRaw(input.script, "hex").toASM()
      },
      previousScript: input.coin.script,
      value: input.coin.value,
      legacyAddress: bchaddr.toLegacyAddress(
        input.coin.address.replace("bitcoincash:", "")
      ),
      cashAddress: input.coin.address
    };
    if (input.slp) {
      inObj = {
        ...inObj,
        ...{
          slpToken: {
            tokenId: input.slp.tokenId,
            amount: input.slp.value
          }
        }
      };
    }
    return inObj;
  });
  tx.transaction.vout = transaction.outputs.map(output => {
    const script = bcoin.Script.fromRaw(output.script, "hex");
    let scriptPubKeyObj = {
      hex: output.script,
      asm: script.toASM()
    };
    if (!script.isNulldata()) {
      scriptPubKeyObj = {
        ...scriptPubKeyObj,
        ...{
          addresses: [
            bchaddr.toLegacyAddress(output.address.replace("bitcoincash:", ""))
          ],
          type: bcoin.Script.typesByVal[script.getType()],
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
    if (output.slp) {
      outObj = {
        ...outObj,
        ...{
          slpToken: {
            tokenId: output.slp.tokenId,
            amount: output.slp.amount
          }
        }
      };
    }
    return outObj;
  });
  // Set tokenMetadata
  if (transaction.slpToken) {
    tx.tokenMetadata = {
      tokenId: transaction.slpToken.tokenId,
      tokenTicker: transaction.slpToken.ticker,
      tokenName: transaction.slpToken.name,
      tokenDocumentUrl: transaction.slpToken.uri,
      tokenDocumentHash: transaction.slpToken.hash
    };
  }

  return tx;
};

const sendTx = async (hex: string, log: Boolean = true): Promise<string> => {
  const req = await fetch(`${API}/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tx: hex })
  });
  const resp = await req.json();
  if (!resp.success) {
    throw new Error("Transaction broadcast error");
  }
  const tx = bcoin.TX.fromRaw(hex, "hex");
  const hash = tx.txid().toString("hex");
  if (log) console.log("sendTx() res: ", hash);
  return hash;
};

export { getCurrentBlockheight, getUtxosByAddress, getTransaction, sendTx };
