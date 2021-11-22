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

export type CoinJSON = {
  vout: number;
  tokenId: string;
  value: string;
  type: "SEND" | "MINT" | "BATON" | "GENESIS";
};

export type UTXOJSON = {
  version: number;
  height: number;
  value: number;
  script: string;
  address: string;
  coinbase: boolean;
  hash: string;
  index: number;
  slp?: CoinJSON;
};

export type State = {
  byId: {
    [utxoId: string]: UTXOJSON;
  };
  allIds: string[];
  byAccount: {
    [accountId: string]: string[];
  };
  updating: boolean;
  timestamp?: number;
  spentIds?: string[];
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
    utxos: UTXOJSON[];
    address: string;
    spentIds?: string[];
  }
) => {
  const { address, utxos, spentIds } = payload;

  const timestamp = spentIds
    ? Date.now()
    : Date.now() - (state.timestamp || 0) < 180000
    ? state.timestamp
    : undefined;
  const fullSpentIds = timestamp
    ? spentIds
      ? [...(state.spentIds || []), ...spentIds]
      : state.spentIds || []
    : [];

  const allIds = utxos.map(utxo => `${utxo.hash}_${utxo.index}`);
  const nextById = utxos.reduce((prev, curr, index) => {
    return {
      ...prev,
      [allIds[index]]: curr
    };
  }, {});

  const nextState = {
    ...state,
    byId: nextById,
    allIds,
    byAccount: {
      ...state.byAccount,
      [address]: allIds
    },
    updating: false,
    timestamp: timestamp,
    spentIds: fullSpentIds
  };

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
