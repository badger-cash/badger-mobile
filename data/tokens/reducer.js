// @flow

// Meta data about all token data

import { UPDATE_TOKEN_META } from "./constants";

type TokenData = {
  address: string,
  symbol: string,
  decimals: number,
  string: string, // what is this?
  protocol: "slp" | "whc",
  protocolData: {
    baton: boolean
  }
};

type State = {
  byId: { [tokenId]: TokenData },
  allIds: string[]
};

const initialState: State = { byId: {}, allIds: [] };

const tokenReducer = (state: State = initialState, action) => {
  switch (state) {
    case UPDATE_TOKEN_META:
      return state;
    default:
      return state;
  }
};

export default tokenReducer;
