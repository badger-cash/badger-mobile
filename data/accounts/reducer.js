// @flow

import { ADD_ACCOUNT } from "./constants";

export type Account = {
  name: string,
  seedwords: string[], // SHOULD BE ENCRYPTED? MAYBE? MAYBE NOT?
  privateKey: string // SAME FOR THIS.  ENCRYPTED WITHIN APP?
};

type Action = { type: string, payload: any };

export type State = { all: Account[], active: ?number };

export const initialState: State = { all: [], active: null };

const addAccount = (state: State, payload: Account) => {
  return { all: [...state.all, payload], active: state.all.length - 1 };
};

const accounts = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case ADD_ACCOUNT:
      return addAccount(state, action.payload);
    default:
      return state;
  }
};

export default accounts;
