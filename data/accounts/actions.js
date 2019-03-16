// @flow

import {
  ADD_ACCOUNT,
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL
} from "./constants";

import { deriveAccount } from "../../utils/keyring";

const getAccountStart = () => ({
  type: GET_ACCOUNT_START,
  payload: null
});

const getAccountSuccess = () => ({
  type: GET_ACCOUNT_SUCCESS,
  payload: null
});

const getAccountFail = () => ({
  type: GET_ACCOUNT_FAIL,
  payload: null
});

export const getAccount = seed => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(getAccountStart());
    const account = deriveAccount(seed);
    console.log("get account");
    console.log("called");
    console.log(account);
  };
};
