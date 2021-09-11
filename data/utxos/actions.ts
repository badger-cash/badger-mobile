import { chunk } from "lodash";
import uuidv5 from "uuid/v5";
import bcoin from "bcash";

import { toCashAddress, toSlpAddress, toLegacyAddress } from "bchaddrjs-slp";

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  ADDREMOVE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";
import utxos, { UTXO } from "./reducer";

import { activeAccountIdSelector } from "../accounts/selectors";

import { FullState } from "../store";

import { decodeTxOut, getAllUtxoGrpc } from "../../utils/transaction-utils";

import { getTransactions, UTXOResult } from "../../api/grpc";
import { transactionsLatestBlockSelector } from "../selectors";

// Generated from `uuid` cli command
const BADGER_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

const updateUtxoStart = () => ({
  type: UPDATE_UTXO_START,
  payload: null
});

const updateUtxoSuccess = (utxos: UTXO[], address: string) => ({
  type: UPDATE_UTXO_SUCCESS,
  payload: {
    utxos,
    address
  }
});

const addRemoveUtxoSuccess = (
  utxos: UTXO[],
  address: string,
  spentIds: string[]
) => ({
  type: ADDREMOVE_UTXO_SUCCESS,
  payload: {
    utxos,
    address,
    spentIds
  }
});

const updateUtxoFail = () => ({
  type: UPDATE_UTXO_FAIL,
  payload: null
});

// Simple unique ID for each utxo
const computeUtxoId = (utxo: UTXO | { txid: string; vout: number | string }) =>
  uuidv5(`${utxo.txid}_${utxo.vout}`, BADGER_UUID_NAMESPACE);

const refreshUtxos = async (getState: Function, address: string) => {
  // Get all UTXO for account (gRPC having serious delay)
  const utxosAll: UTXOResult[] = await getAllUtxoGrpc(address);

  const utxosAllWithId = utxosAll.map(utxo => ({
    ...utxo,
    _id: computeUtxoId(utxo)
  }));

  const utxosAllIds = utxosAllWithId.map(utxo => utxo._id);

  // Get state and account
  const state: FullState = getState();
  const accountId = activeAccountIdSelector(state);
  if (!accountId) return [];

  // Get the existing UTXO's in store for account
  const utxosSlice = state.utxos;
  const timeSinceLastSend = Date.now() - (utxosSlice.timestamp || 0);
  const accountUtxos = (utxosSlice.byAccount[accountId] || [])
    .map(utxoId => utxosSlice.byId[utxoId])
    .filter(Boolean);

  // Skip fetch (mitigate node slow processing/caching of node)
  if (timeSinceLastSend < 120000) {
    return accountUtxos.filter(u => u.address == address);
  }

  // Remove spent and un-validated SLP txs
  const cachedUtxoFiltered = accountUtxos
    .filter(utxoCached => utxosAllIds.includes(utxoCached._id))
    .filter(utxoCached => !(utxoCached.slp && !utxoCached.validSlpTx));

  const cachedUtxoFilteredIds = cachedUtxoFiltered.map(
    utxoCached => utxoCached._id
  );

  // New utxos to get data for
  const utxosNew = utxosAllWithId.filter(
    utxoCurrent => !cachedUtxoFilteredIds.includes(utxoCurrent._id)
  );

  // // Update UTXOS with tx details before saving
  // const newTxIds = utxosNew.map(utxo => utxo.txid);
  // const txDetailChunks = await Promise.all(
  //   chunk(newTxIds, 20).map(txIds => getTransactions(txIds, true))
  // );

  // const txDetails: any[] = [].concat(...txDetailChunks);
  const utxosNewWithTxDetails = utxosNew.map((utxo, idx) => ({
    ...utxo,
    address
  }));

  // Decode SLP and set as spendable or not
  const utxosSlpOrSpendable = utxosNewWithTxDetails.map(utxo => {
    try {
      const slpDecoded = decodeTxOut(utxo);
      return {
        ...utxo,
        slp: slpDecoded,
        spendable: false
      };
    } catch (e) {
      // Prevent spending of unknown SLP types
      if (e.message === "Unknown token type") {
        return {
          ...utxo,
          spendable: false
        };
      }

      return {
        ...utxo,
        spendable: true
      };
    }
  });

  const slpTxidsToValidate = [
    ...new Set(
      utxosSlpOrSpendable
        .filter(utxo => utxo.slp !== undefined)
        .map(utxo => utxo.txid)
    )
  ];
  let utxosToAdd = null;

  try {
    const validSLPTx = await Promise.all(
      chunk(slpTxidsToValidate, 20).map(async txIdsToValidate => {
        const validatedTxs: {
          valid: boolean;
          txid: string;
        }[] = txIdsToValidate.map(txId => {
          return { valid: true, txid: txId };
        });
        const validSLPTxChunk = validatedTxs
          .filter(chunkResult => chunkResult.valid === true)
          .map(chunkResult => chunkResult.txid);
        return validSLPTxChunk;
      })
    );
    const validSlpTxs = ([] as string[]).concat(...validSLPTx);
    const utxosValidSlpTx = utxosSlpOrSpendable.map(utxo =>
      validSlpTxs.includes(utxo.txid)
        ? {
            ...utxo,
            validSlpTx: true
          }
        : utxo
    );
    // Validation incomplete. Ignore all uncached SLP UTXOs
    utxosToAdd = utxosValidSlpTx;
  } catch (validateSLPTxException) {
    const nonSLPUtxos = utxosSlpOrSpendable.filter(
      utxo => utxo.slp === undefined
    );

    utxosToAdd = nonSLPUtxos;
  }

  // Update the UTXO's for a given account.
  // Fetch all UTXOS, update them with relevant token metadata, and persist
  const utxosUpdatedFull = [...cachedUtxoFiltered, ...utxosToAdd];
  // console.log("utxosUpdatedFull", utxosUpdatedFull)
  return utxosUpdatedFull;
};

const updateUtxos = (address: string, addressSlp: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!address || !addressSlp) {
      return;
    }

    dispatch(updateUtxoStart());
    // const state: FullState = getState();

    // const utxosUpdatedFull = await refreshUtxos(state, address);

    // const utxosUpdatedFullSlp = await refreshUtxos(state, addressSlp);
    // console.log('utxosUpdatedFullSlp', JSON.stringify(utxosUpdatedFullSlp[utxosUpdatedFullSlp.length - 2]))

    const [utxosUpdatedFull, utxosUpdatedFullSlp] = await Promise.all([
      refreshUtxos(getState, address),
      refreshUtxos(getState, addressSlp)
    ]);

    // Get state and account
    const state: FullState = getState();
    const accountId = activeAccountIdSelector(state);
    if (!accountId) return [];

    // Get the existing UTXO's in store for account
    const utxosSlice = state.utxos;
    const timeSinceLastSend = Date.now() - (utxosSlice.timestamp || 0);
    const accountUtxos = (utxosSlice.byAccount[accountId] || [])
      .map(utxoId => utxosSlice.byId[utxoId])
      .filter(Boolean);

    // Skip fetch (mitigate node slow processing/caching of node)
    if (timeSinceLastSend < 120000) {
      dispatch(
        updateUtxoSuccess(
          accountUtxos.filter(
            u => u.address == address || u.address == addressSlp
          ),
          address
        )
      );
    } else {
      dispatch(
        updateUtxoSuccess(
          [...utxosUpdatedFull, ...utxosUpdatedFullSlp],
          address
        )
      );
    }
  };
};

const addRemoveUtxos = (
  address: string,
  slpAddress: string,
  transaction: {
    txid: string;
    outputs: typeof bcoin.Output[];
    inputs: typeof bcoin.Input[];
  }
) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(updateUtxoStart());
    const state: FullState = getState();
    const latestBlock = transactionsLatestBlockSelector(state);
    const accountId = activeAccountIdSelector(state);
    if (!accountId) return [];

    // Get the existing UTXO's in store for account
    const utxosSlice = state.utxos;
    const allUtxos = (utxosSlice.byAccount[accountId] || [])
      .map(utxoId => utxosSlice.byId[utxoId])
      .filter(Boolean);

    // Remove any UTXOs specified in utxosToRemove
    const idsToRemove = transaction.inputs.map(input =>
      computeUtxoId({
        txid: input.prevout.hash,
        vout: input.prevout.index
      })
    );

    const updatedUtxos = allUtxos.filter(
      utxo => !idsToRemove.includes(utxo._id)
    );

    // TODO: Code below is for adding outputs as new, spendable UTXOs
    // An array of properly ordered scriptPubKeys for the transaction
    const txScripts = transaction.outputs.map(out => {
      return { scriptPubKey: { hex: out.script } };
    });
    // Add any UTXOs specified in utxosToAdd. Be sure SLP, address, and spendable properties have been assigned
    const utxosToAdd: UTXO[] = [];
    const cashAddressArray = [address, toCashAddress(slpAddress)];
    console.log("cashAddressArray", cashAddressArray);
    for (let i = 0; i < transaction.outputs.length; i++) {
      if (cashAddressArray.includes(transaction.outputs[i].address)) {
        const id = computeUtxoId({ txid: transaction.txid, vout: i });

        // If this UTXO is already in our set, skip processing
        if (utxosSlice.allIds.includes(id)) {
          console.log("utxo id already in set", id);
          continue;
        }

        let utxo: UTXO = {
          _id: id,
          txid: transaction.txid,
          confirmations: 0,
          height: latestBlock,
          satoshis: transaction.outputs[i].value,
          amount: transaction.outputs[i].value / 10 ** 8,
          vout: i,
          tx: {
            vout: txScripts
          },
          address: transaction.outputs[i].address,
          cashAddress: transaction.outputs[i].address,
          legacyAddress: toLegacyAddress(transaction.outputs[i].address)
        };
        // Check if is SLP
        try {
          const slpDecoded = decodeTxOut(utxo);
          utxo = {
            ...utxo,
            slp: slpDecoded,
            spendable: false,
            validSlpTx: true
          };
        } catch (e) {
          // Prevent spending of unknown SLP types
          if (e.message === "Unknown token type") {
            utxo = {
              ...utxo,
              spendable: false
            };
          }

          utxo = {
            ...utxo,
            spendable: true
          };
        }

        console.log("utxoToAdd", utxo);

        updatedUtxos.push(utxo);
      }
    }

    dispatch(addRemoveUtxoSuccess(updatedUtxos, address, idsToRemove));
  };
};

export {
  addRemoveUtxos,
  updateUtxos,
  updateUtxoStart,
  addRemoveUtxoSuccess,
  updateUtxoSuccess,
  updateUtxoFail
};
