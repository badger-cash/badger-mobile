import { chunk } from "lodash";
import uuidv5 from "uuid/v5";

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";
import { UTXO } from "./reducer";

import { activeAccountIdSelector } from "../accounts/selectors";

import { FullState } from "../store";

import {
  getAllUtxo,
  getTransactionDetails,
  decodeTxOut
} from "../../utils/transaction-utils";
import { SLP } from "../../utils/slp-sdk-utils";

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

const updateUtxoFail = () => ({
  type: UPDATE_UTXO_FAIL,
  payload: null
});

// Simple unique ID for each utxo
const computeUtxoId = (utxo: UTXO) =>
  uuidv5(`${utxo.txid}_${utxo.vout}`, BADGER_UUID_NAMESPACE);

const refreshUtxos = async (state: FullState, address: string) => {
  const accountId = activeAccountIdSelector(state);
  if (!accountId) return [];

  // Get the existing UTXO's in store for account
  const utxosSlice = state.utxos;
  const accountUtxos = (utxosSlice.byAccount[accountId] || [])
    .map(utxoId => utxosSlice.byId[utxoId])
    .filter(Boolean);

  // Get all UTXO for account
  const utxosAll: UTXO[] = await getAllUtxo(address);

  const utxosAllWithId = utxosAll.map(utxo => ({
    ...utxo,
    _id: computeUtxoId(utxo)
  }));

  const utxosAllIds = utxosAllWithId.map(utxo => utxo._id);

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

  // Update UTXOS with tx details before saving
  const newTxIds = utxosNew.map(utxo => utxo.txid);
  const txDetailChunks = await Promise.all(
    chunk(newTxIds, 20).map(txIds => getTransactionDetails(txIds))
  );

  const txDetails = [].concat(...txDetailChunks);
  const utxosNewWithTxDetails = utxosNew.map((utxo, idx) => ({
    ...utxo,
    tx: txDetails[idx],
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
        }[] = await SLP.Utils.validateTxid(txIdsToValidate);
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
  return utxosUpdatedFull;
};

const updateUtxos = (address: string, addressSlp: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!address || !addressSlp) {
      return;
    }

    dispatch(updateUtxoStart());
    const state: FullState = getState();
    const utxosUpdatedFull = await refreshUtxos(state, address);

    const utxosUpdatedFullSlp = await refreshUtxos(state, addressSlp);

    dispatch(
      updateUtxoSuccess([...utxosUpdatedFull, ...utxosUpdatedFullSlp], address)
    );
  };
};

export { updateUtxos };
