// @flow

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";

type UTXO = {};

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

const utxos = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case UPDATE_UTXO_START:
      return state;
    case UPDATE_UTXO_SUCCESS:
      return state;
    case UPDATE_UTXO_FAIL:
      return state;
    default:
      return state;
  }
};

export default utxos;
