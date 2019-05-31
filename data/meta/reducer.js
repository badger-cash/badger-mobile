// @flow

// Pretty sure this reducer is safe to delete for now?

// import { SELECT_TOKEN } from "./constants";

type Action = { type: string, payload: any };

// Consider putting selected account here also?
// Or consider moving this to the account reducer
export type State = {
  // selectedTokenId: ?string,
  network: "mainnet" | "testnet"
};

// token Metadata

export const initialState: State = {
  // selectedTokenId: null,
  network: "mainnet"
};

// const selectToken = (state: State, payload: string) => {
//   return { ...state, selectTokenId: payload };
// };

const meta = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    // case SELECT_TOKEN:
    //   return selectToken(state, action.payload);
    default:
      return state;
  }
};

export default meta;
