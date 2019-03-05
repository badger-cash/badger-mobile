// @flow
import { ADD_ACCOUNT } from "./constants";

export const addAccount = (account: any) => ({
  type: ADD_ACCOUNT,
  payload: account
});
