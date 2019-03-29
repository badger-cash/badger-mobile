// @flow

import { type FullState } from "../store";

const tokensByIdSelector = (state: FullState) => {
  const { byId } = state.tokens;
  return byId;
};

export { tokensByIdSelector };
