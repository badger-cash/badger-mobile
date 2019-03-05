// @flow

import { SELECT_TOKEN } from "./constants";

export const selectToken = (tokenId: string) => ({
  type: SELECT_TOKEN,
  payload: tokenId
});
