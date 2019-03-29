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
  allIds: string[],
  updating: boolean
};

export const initialState: State = { byId: {}, allIds: [], updating: false };

const updateTokens = (state: State, tokens: TokenData[]) => {
  if (!tokens.length) return state;
  const allIdsNext = tokens.map(val => val.tokenId);
  const byIdNext = tokens.reduce((prev, curr) => {
    return { ...prev, [curr.tokenId]: curr };
  }, state.byId);
  return {
    byId: byIdNext,
    allIds: allIdsNext,
    updating: false
  };
};

const tokensReducer = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case UPDATE_TOKENS_META_START:
      return { ...state, updating: true };
    case UPDATE_TOKENS_META_SUCCESS:
      return updateTokens(state, action.payload.tokens);
    case UPDATE_TOKENS_META_FAIL:
      return state;
    default:
      return state;
  }
};

export default tokensReducer;
