// @flow

import { createSelector } from "reselect";
import _ from "lodash";

const transactionsSelector = state => state.transactions;

const transactionsByAccountSelector = (
  state: FullState,
  { address, tokenId }: { address: ?string, tokenId?: ?string }
) => {
  if (!address) return [];

  const { byId, byAccount } = state.transactions;
  const transactionTransactionsIds = byAccount[address];

  if (!transactionTransactionsIds) return [];

  const transactions = byAccount[address]
    .map(txHash => byId[txHash])
    .filter(tx => {
      const txTokenId =
        tx.txParams.sendTokenData && tx.txParams.sendTokenData.tokenId;
      if (tokenId) {
        return tokenId === txTokenId;
      }
      return !tokenId;
    });

  return _.sortBy(transactions, ["time"]).reverse();
};

export { transactionsSelector, transactionsByAccountSelector };
