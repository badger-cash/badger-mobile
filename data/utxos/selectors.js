// @flow

import { createSelector } from "reselect";
import { type FullState } from "../store";

const utxosSelector = (state: FullState) => state.utxos;

const utxosByAccountSelector = (state: FullState, address: string) => {
  const { byId, byAccount } = state.utxos;

  const accountUtxoIds = byAccount[address];

  if (!address || !accountUtxoIds) return [];
  return byAccount[address].map(utxoId => byId[utxoId]);
};

export { utxosSelector, utxosByAccountSelector };
