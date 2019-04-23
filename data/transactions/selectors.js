// @flow

import { createSelector } from "reselect";
import _ from "lodash";

const transactionsSelector = state => state.transactions;

const transactionsByAccountSelector = (state: FullState, address: ?string) => {
  if (!address) return [];

  const { byId, byAccount } = state.transactions;
  const transactionTransactionsIds = byAccount[address];

  if (!transactionTransactionsIds) return [];

  const transactions = byAccount[address].map(txHash => byId[txHash]);

  return _.sortBy(transactions, ["time"]).reverse();
};

export { transactionsSelector, transactionsByAccountSelector };
