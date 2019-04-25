// @flow

import {
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL,
  LOGOUT_ACCOUNT
} from "./constants";

// Todo - Fill in this type as needed
export type ECPair = {
  compressed: boolean,
  d: any,
  network: any,
  __Q: any
};

export type Account = {
  address: string,
  addressSlp: string,
  keypair?: ECPair,
  keypairSlp?: ECPair,
  mnemonic: string,
  accountIndex: string
};

type Action = { type: string, payload: any };

export type State = {
  byId: { [accountId: string]: Account },
  keypairsByAccount: { [accountId: string]: ECPair },
  allIds: string[],
  activeId: ?string
};

export const initialState: State = {
  byId: {},
  allIds: [],
  activeId: null,
  keypairsByAccount: {}
};

const addAccount = (
  state: State,
  payload: { account: Account, accountSlp: Account }
) => {
  const { account, accountSlp } = payload;

  const { keypair, ...removedKeypair } = account;
  const { address } = account;

  const combinedAccount = {
    ...removedKeypair,
    addressSlp: accountSlp.address
  };

  const keypairSlp = accountSlp.keypair;

  const existingAcounts = state.allIds;
  if (existingAcounts.includes(address)) {
    return {
      ...state,
      keypairsByAccount: {
        ...state.keypairsByAccount,
        [address]: { bch: keypair, slp: keypairSlp }
      }
    };
  }

  return {
    ...state,
    byId: { ...state.byId, [address]: combinedAccount },
    keypairsByAccount: {
      ...state.keypairsByAccount,
      [address]: { bch: keypair, slp: keypairSlp }
    },
    allIds: [...state.allIds, address],
    activeId: address
  };
};

const logoutAccount = (state: State) => {
  return initialState;
};

const accounts = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case GET_ACCOUNT_START:
      return state;
    case GET_ACCOUNT_SUCCESS:
      return addAccount(state, action.payload);
    case LOGOUT_ACCOUNT:
      return logoutAccount(state);
    default:
      return state;
  }
};

export default accounts;
