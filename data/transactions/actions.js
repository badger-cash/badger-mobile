// @flow

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import { getHistoricalBchTransactions } from "../../utils/balance-utils";

const getTransactionsStart = () => ({
  type: GET_TRANSACTIONS_START,
  payload: null
});

const getTransactionsSuccess = (transactions: any[]) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: { transactions }
});

const getTransactionsFail = () => ({
  type: GET_TRANSACTIONS_FAIL,
  payload: null
});

const updateTransactions = (address: string) => {
  return async (dispatch: Function, getState: Function) => {
    console.log("1 - ENTERING GET TRANSACTION");
    dispatch(getTransactionsStart());
    //  TODO - Error or fail state
    const transactions = await getHistoricalBchTransactions(address);
    console.log("2 - GOT TRANSACTIONS?");
    console.log(transactions);

    dispatch(getTransactionsSuccess(transactions));
  };
};

export { updateTransactions };
