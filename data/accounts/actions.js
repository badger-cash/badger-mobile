// @flow

import {
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL,
  LOGOUT_ACCOUNT
} from "./constants";

import { type Account } from "./reducer";

import { deriveAccount } from "../../utils/account-utils";

const getAccountStart = () => ({
  type: GET_ACCOUNT_START,
  payload: null
});

const getAccountSuccess = (account: Account) => ({
  type: GET_ACCOUNT_SUCCESS,
  payload: { account }
});

const getAccountFail = () => ({
  type: GET_ACCOUNT_FAIL,
  payload: null
});

const getAccount = (seed: string) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(getAccountStart());
    const account = deriveAccount(seed);
    dispatch(getAccountSuccess(account));
  };
};

const logoutAccount = () => {
  return {
    type: LOGOUT_ACCOUNT,
    payload: null
  };
};

export { getAccount, logoutAccount };
