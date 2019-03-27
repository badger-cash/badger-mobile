// @flow

import { createSelector } from "reselect";

const utxosSelector = state => state.utxos;

const utxosByAccountSelector = (state, address) => {
  const { byId, byAccount } = state.utxos;

  const accountUtxoIds = byAccount[address];

  if (!address || !accountUtxoIds) return [];
  return byAccount[address].map(utxoId => byId[utxoId]);
};

export { utxosSelector, utxosByAccountSelector };
