// @flow

import { createSelector } from "reselect";

const utxosSelector = state => state.utxos;

const utxosByAccountSelector = (state, address) => {
  const { byId, byAccount } = state.utxos;

  if (!address) return [];
  return byAccount[address].map(utxoId => byId[utxoId]);
};

export { utxosSelector, utxosByAccountSelector };
