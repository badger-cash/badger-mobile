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

const bchBalanceSelector = createSelector(
  utxosByAccountSelector,
  utxos => {
    console.log("utxos in selector??");
    console.log(utxos);
    return 1.32342432;
  }
);

export { bchBalanceSelector };
