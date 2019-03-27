// @flow

import { createSelector } from "reselect";

import { activeAccountSelector } from "./accounts/selectors";
import { transactionsSelector } from "./transactions/selectors";
import { utxosByAccountSelector } from "./utxos/selectors";

const transactionsActiveAccountSelector = createSelector(
  activeAccountSelector,
  transactionsSelector,
  (activeAccount, transactions) => {
    const { address } = activeAccount;
    return transactions.byAccountId[address];
  }
);

const balancesSelector = createSelector(
  utxosByAccountSelector,
  utxos => {
    const balancesInitial = {
      satoshisAvailable: 0,
      satoshisLockedInMintingBaton: 0,
      satoshisLockedInTokens: 0,
      slpTokens: {}
    };

    // Likely compute these in different selectors if needed.
    // const validTokenIds = [];
    // const batons = [];

    const balances = utxos.reduce((prev, utxo) => {
      if (utxo.slp && utxo.validSlpTx === true) {
        if (utxo.slp.baton) {
          return {
            ...prev,
            satoshisLockedInMintingBaton:
              prev.satoshisLockedInMintingBaton + utxo.satoshis
          };
        } else {
          const { token, quantity } = utxo.slp;
          const previousQuantity = prev.slpTokens.token || 0;
          return {
            ...prev,
            satoshisLockedInTokens: prev.satoshisLockedInTokens + utxo.satoshis,
            slpTokens: {
              ...prev.slpTokens,
              [token]: previousQuantity + quantity
            }
          };
        }
      }
      if (utxo.spendable) {
        return {
          ...prev,
          satoshisAvailable: prev.satoshisAvailable + utxo.satoshis
        };
      }
      return prev;
    }, balancesInitial);

    return balances;
  }
);

export { balancesSelector };
