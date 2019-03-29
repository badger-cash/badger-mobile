// @flow

// Meta data about all tokens

import {
  UPDATE_TOKENS_META_START,
  UPDATE_TOKENS_META_SUCCESS,
  UPDATE_TOKENS_META_FAIL
} from "./constants";

export type TokenData = {
  tokenId: string,
  symbol: string,
  name: string,
  decimals: number,
  protocol: "slp",
  protocolData?: {
    baton: boolean
  }
};

type Action = { type: string, payload: any };

export type State = {
  byId: { [tokenId: string]: TokenData },
  allIds: string[]
};

export const initialState: State = { byId: {}, allIds: [] };

const tokensReducer = (state: State = initialState, action: Action) => {
  switch (state) {
    case UPDATE_TOKENS_META_START:
      return state;
    case UPDATE_TOKENS_META_SUCCESS:
      return state;
    case UPDATE_TOKENS_META_FAIL:
      return state;
    default:
      return state;
  }
};

export default tokensReducer;
