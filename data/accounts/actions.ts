import {
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL,
  LOGOUT_ACCOUNT,
  VIEW_SEED
} from "./constants";

import { Account } from "./reducer";

import { deriveAccount, generateMnemonic } from "../../utils/account-utils";

const getAccountStart = () => ({
  type: GET_ACCOUNT_START,
  payload: null
});

const getAccountSuccess = (
  account: Account,
  accountSlp: Account,
  isNew: boolean
) => ({
  type: GET_ACCOUNT_SUCCESS,
  payload: {
    account,
    accountSlp,
    isNew
  }
});

const getAccountFail = () => ({
  type: GET_ACCOUNT_FAIL,
  payload: null
});

const getAccount = (mnemonic?: string, accountIndex: number = 0) => {
  const accountMnemonic = mnemonic ? mnemonic : generateMnemonic();
  const isNew = !mnemonic;

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
    ) as Account;

    const accountSlp = deriveAccount(
      accountMnemonic,
      accountIndex,
      childIndex,
      derivationPathSLP
    ) as Account;

    dispatch(getAccountSuccess(account, accountSlp, isNew));
  };
};

const logoutAccount = () => {
  return {
    type: LOGOUT_ACCOUNT,
    payload: null
  };
};

const viewSeed = (address: string) => {
  return {
    type: VIEW_SEED,
    payload: {
      address
    }
  };
};

export {
  getAccount,
  getAccountStart,
  getAccountSuccess,
  getAccountFail,
  logoutAccount,
  viewSeed
};
