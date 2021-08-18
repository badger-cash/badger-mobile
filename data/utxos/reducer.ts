import { AnyAction } from "redux";
import BigNumber from "bignumber.js";

import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  ADDREMOVE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";

import { LOGOUT_ACCOUNT } from "../accounts/constants";
import { ECPair } from "../accounts/reducer";

export type UTXO = {
  _id: string;
  txid: string;
  confirmations: number;
  amount: number;
  height: number;
  vout: any;
  tx: { vout: { scriptPubKey: { hex: string } }[] };
  satoshis: number;
  slp: {
    baton: any;
    token: string;
    quantity: BigNumber;
  };
  validSlpTx: boolean;
  spendable: boolean;
  address: string;
  keypair?: ECPair;
};

export type State = {
  byId: {
    [utxoId: string]: UTXO;
  };
  allIds: string[];
  byAccount: {
    [accountId: string]: string[];
  };
  updating: boolean;
  timestamp?: number;
};

export const initialState: State = {
  byId: {},
  allIds: [],
  byAccount: {},
  updating: false
};

const addUtxos = (
  state: State,
  payload: {
    utxos: UTXO[];
    address: string;
    timestamp?: number;
  }
) => {
  const { address, utxos, timestamp } = payload;

  console.log("utxos.length", utxos.length);

  // Currently fully replaces all utxos with passed in set.
  // In future should only add then prune completely unused ones by account
  const nextById = Object.values(utxos).reduce((prev, curr) => {
    return {
      ...prev,
      [curr._id]: curr
    };
  }, {});

  const nextState = {
    ...state,
    byId: nextById,
    allIds: utxos.map(utxo => utxo._id),
    byAccount: {
      ...state.byAccount,
      [address]: utxos.map(utxo => utxo._id)
    },
    updating: timestamp ? true : false,
    timestamp: timestamp
  };

  console.log("nextState.byId.length", Object.values(nextState.byId).length);
  console.log("nextState.updating", nextState.updating);

  return nextState;
};

const utxos = (state: State = initialState, action: AnyAction): State => {
  switch (action.type) {
    case UPDATE_UTXO_START:
      return {
        ...state,
        updating: true
      };

    case UPDATE_UTXO_SUCCESS:
      return addUtxos(state, action.payload);

    case ADDREMOVE_UTXO_SUCCESS:
      return addUtxos(state, action.payload);

    case UPDATE_UTXO_FAIL:
      return {
        ...state,
        updating: false
      };

    case LOGOUT_ACCOUNT:
      return initialState;

    default:
      return state;
  }
};

export default utxos;
