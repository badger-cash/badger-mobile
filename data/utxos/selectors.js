// @flow

import { createSelector } from "reselect";
import { type FullState } from "../store";

const utxosSelector = (state: FullState) => state.utxos;

const utxosByAccountSelector = (state: FullState, address: ?string) => {
  if (!address) return null;

  const { byId, byAccount } = state.utxos;
  const accountUtxoIds = byAccount[address];

  if (!accountUtxoIds) return null;

  return byAccount[address].map(utxoId => byId[utxoId]);
};

const doneInitialLoadSelector = createSelector(
  utxosByAccountSelector,
  utxos => {
    return !!utxos;
  }
);

export { utxosSelector, utxosByAccountSelector, doneInitialLoadSelector };
