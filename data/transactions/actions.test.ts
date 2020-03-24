import configureMockStore from "redux-mock-store";
import thunk, { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";

import {
  getTransactionsStart,
  getTransactionsFail,
  getTransactionsSuccess,
  updateTransactions
} from "./actions";

import * as actionTypes from "./constants";
import { initialState, Transaction } from "./reducer";
import { FullState } from "../store";

describe("transactions::action::creators", () => {
  it("get transactions start", () => {
    const expectedAction = {
      type: actionTypes.GET_TRANSACTIONS_START,
      payload: null
    };
    expect(getTransactionsStart()).toEqual(expectedAction);
  });

  it("get transactions success", () => {
    const tokenData = (["any", "values"] as unknown) as Transaction[];
    const now = +new Date();

    const expectedAction = {
      type: actionTypes.GET_TRANSACTIONS_SUCCESS,
      payload: {
        transactions: tokenData,
        address: "bchAddress",
        timestamp: now
      }
    };

    expect(getTransactionsSuccess(tokenData, "bchAddress", now)).toEqual(
      expectedAction
    );
  });

  it("get transactions fail", () => {
    const expectedAction = {
      type: actionTypes.GET_TRANSACTIONS_FAIL,
      payload: null
    };
    expect(getTransactionsFail()).toEqual(expectedAction);
  });
});

describe("transactions::action::async", () => {
  it.todo("update transactions - this one might be tricky");
});
