// @flow

import {
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL,
  LOGOUT_ACCOUNT
} from "./constants";

import { type Account } from "./reducer";

import {
  deriveAccount,
  addressToSlp,
  generateMnemonic
} from "../../utils/account-utils";

const getAccountStart = () => ({
  type: GET_ACCOUNT_START,
  payload: null
});

const getAccountSuccess = (account: Account, accountSlp: Account) => ({
  type: GET_ACCOUNT_SUCCESS,
  payload: { account, accountSlp }
});

const getAccountFail = () => ({
  type: GET_ACCOUNT_FAIL,
  payload: null
});

const getAccount = (mnemonic?: string, accountIndex?: number = 0) => {
  const accountMnemonic = mnemonic ? mnemonic : generateMnemonic();

  return async (dispatch: Function, getState: Function) => {
    dispatch(getAccountStart());

    const derivationPathBCH = "m/44'/145'";
    const derivationPathSLP = "m/44'/245'";

    const childIndex = 0;
    //  TODO - Error or fail state
    const account = deriveAccount(
      accountMnemonic,
      accountIndex,
      childIndex,
      derivationPathBCH
    );

    const accountSlp = deriveAccount(
      accountMnemonic,
      accountIndex,
      childIndex,
      derivationPathSLP
    );

    dispatch(getAccountSuccess(account, accountSlp));
  };
};

const logoutAccount = () => {
  return {
    type: LOGOUT_ACCOUNT,
    payload: null
  };
};

export { getAccount, logoutAccount };
