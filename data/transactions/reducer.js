// @flow

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

type Transaction = {};

type Action = { type: string, payload: any };

export type State = {
  byId: { [transactionId: string]: Transaction },
  allIds: string[],
  byAccountId: { [accountId: string]: string[] },
  updating: boolean
};

export const initialState: State = {
  byId: {},
  allIds: [],
  byAccountId: {},
  updating: false
};

const transactions = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case GET_TRANSACTIONS_START:
      return { ...state, updating: true };
    case GET_TRANSACTIONS_SUCCESS:
      return state;
    case GET_TRANSACTIONS_FAIL:
      return state;
    default:
      return state;
  }
};

export default transactions;
