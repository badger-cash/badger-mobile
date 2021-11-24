import uuidv5 from "uuid/v5";

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  ADDREMOVE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";
import { UTXOJSON } from "./reducer";

import { getAllUtxos } from "../../utils/transaction-utils";

// Generated from `uuid` cli command
const BADGER_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

const updateUtxoStart = () => ({
  type: UPDATE_UTXO_START,
  payload: null
});

const updateUtxoSuccess = (utxos: UTXOJSON[], address: string) => ({
  type: UPDATE_UTXO_SUCCESS,
  payload: {
    utxos,
    address
  }
});

const addRemoveUtxoSuccess = (
  utxos: UTXOJSON[],
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
const computeUtxoId = (
  utxo: UTXOJSON | { txid: string; vout: number | string }
) => uuidv5(`${utxo.hash}_${utxo.index}`, BADGER_UUID_NAMESPACE);

const refreshUtxos = async (getState: Function, address: string) => {
  // Get all UTXO for account
  const utxosAll: UTXOJSON[] = await getAllUtxos(address);
  return utxosAll;
};

const updateUtxos = (address: string, addressSlp: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!address || !addressSlp) {
      return;
    }

    dispatch(updateUtxoStart());

    const [utxosUpdatedFull, utxosUpdatedFullSlp] = await Promise.all([
      refreshUtxos(getState, address),
      refreshUtxos(getState, addressSlp)
    ]);

    dispatch(
      updateUtxoSuccess([...utxosUpdatedFull, ...utxosUpdatedFullSlp], address)
    );
  };
};

export {
  updateUtxos,
  updateUtxoStart,
  addRemoveUtxoSuccess,
  updateUtxoSuccess,
  updateUtxoFail
};
