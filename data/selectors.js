// @flow

import { createSelector } from "reselect";

import { activeAccountSelector } from "./accounts/selectors";
import { transactionsSelector } from "./transactions/selectors";

const transactionsActiveAccountSelector = createSelector(
  activeAccountSelector,
  transactionsSelector,
  (activeAccount, transactions) => {
    const { address } = activeAccount;
    return transactions.byAccountId[address];
  }
);

const bchBalanceSelector = createSelector(
  transactionsActiveAccountSelector,
  transactions => {
    return 1.32342432;
  }
);

export { bchBalanceSelector };
