// @flow

import { SELECT_TOKEN } from "./constants";

type Action = { type: string, payload: any };

// Consider putting selected account here also?
// Or consider moving this to the account reducer
export type State = {
  selectedTokenId: ?string
};

export const initialState: State = { selectedTokenId: null };

const selectToken = (state: State, payload: string) => {
  return { ...state, selectTokenId: payload };
};

const accounts = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case SELECT_TOKEN:
      return selectToken(state, action.payload);
    default:
      return state;
  }
};

export default accounts;
