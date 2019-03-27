// @flow

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";

export type UTXO = {
  txid: string,
  confirmations: number,
  amount: number,
  height: number,
  vout: any,
  tx: {},
  satoshis: number,
  slp: { baton: any, token: string },
  validSlpTx: boolean,
  spendable: boolean
};

type Action = { type: string, payload: any };

export type State = {
  byId: { [utxoId: string]: UTXO },
  allIds: string[],
  byAccount: { [accountId: string]: string[] },
  updating: boolean
};

export const initialState: State = {
  byId: {},
  allIds: [],
  byAccount: {},
  updating: false
};

const addUtxos = (
  state: State,
  { utxos, address }: { utxos: UTXO[], address: string }
) => {
  console.log("adding utxos ");
  console.log(address);
  return state;
};

const utxos = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case UPDATE_UTXO_START:
      return { ...state, updating: true };
    case UPDATE_UTXO_SUCCESS:
      return { ...addUtxos(state, action.payload), updating: false };
    case UPDATE_UTXO_FAIL:
      return { ...state, updating: false };
    default:
      return state;
  }
};

export default utxos;
