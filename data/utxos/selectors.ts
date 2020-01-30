import { createSelector } from "reselect";
import { FullState } from "../store";

const utxosSelector = (state: FullState) => state.utxos;

const utxosByAccountSelector = (state: FullState, address?: string | null) => {
  if (!address) return [];

  const { byId, byAccount } = state.utxos;
  const accountUtxoIds = byAccount[address];

  if (!accountUtxoIds) return [];

  return byAccount[address].map(utxoId => byId[utxoId]);
};

const doneInitialLoadSelector = createSelector(
  utxosByAccountSelector,
  utxos => {
    return !!utxos;
  }
);

const isUpdatingUTXO = (state: FullState) => {
  return state.utxos.updating;
};

export {
  utxosSelector,
  utxosByAccountSelector,
  doneInitialLoadSelector,
  isUpdatingUTXO
};
