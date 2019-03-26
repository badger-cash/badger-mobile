// @flow

import { activeAccountIdSelector } from "../accounts/selectors";

const updateBalances = address => {
  return async (dispatch: Function, getState: Function) => {
    const state = getState();
    const accountId = activeAccountIdSelector(state);

    console.log(accountId);
    console.log("update balances called");
  };

  // let balance = await this._updateAccountTokens(address)
  // if (!balance) {
  //   balance = accounts[address].balance ? accounts[address].balance : balance
  // }

  // const result = { address, balance }

  // accounts[address] = result
};

// const updateTransactions = (address: string) => {
//   return async (dispatch: Function, getState: Function) => {
//     console.log("1 - ENTERING GET TRANSACTION");
//     dispatch(getTransactionsStart());
//     //  TODO - Error or fail state
//     const transactions = await getHistoricalBchTransactions(address);
//     console.log("2 - GOT TRANSACTIONS?");
//     console.log(transactions);

//     dispatch(getTransactionsSuccess(transactions));
//   };
// };

export { updateBalances };
