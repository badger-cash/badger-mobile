// @flow

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import BigNumber from "bignumber.js";

// export type Transaction = {
//   blk: {
//     h: string,
//     i: number,
//     t: number
//   },
//   in: any[],
//   out: any[],
//   tx: { h: string }
// };

// What we store in redux
export type Transaction = {
  hash: string,
  txParams: {
    from: string,
    to: string,
    fromAddresses: string[],
    toAddresses: string[],
    value: string
  },
  time: number,
  block: number,
  status: "confirmed" | "pending",
  networkId: "mainnet" | "testnet"
};

type Action = { type: string, payload: any };

export type State = {
  byId: { [transactionId: string]: Transaction },
  allIds: string[],
  byAccount: { [accountId: string]: string[] },
  updating: boolean
};

export const initialState: State = {
  byId: {},
  allIds: [],
  byAccount: {},
  updating: false
};

const addTransactions = (
  state,
  payload: { transactions: Transaction[], address: string }
) => {
  const { transactions, address } = payload;

  const transactionsById = transactions.reduce((acc, tx) => {
    return { ...acc, [tx.hash]: tx };
  }, {});

  const txIds = transactions.map(tx => tx.hash);
  const accountsTxIds = { [address]: txIds };

  return {
    ...state,
    byId: { ...state.byId, ...transactionsById },
    byAccount: { ...state.byAccountId, [address]: txIds },
    allIds: [...state.allIds, ...txIds],
    updating: false
  };
};

const transactions = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case GET_TRANSACTIONS_START:
      return { ...state, updating: true };
    case GET_TRANSACTIONS_SUCCESS:
      return addTransactions(state, action.payload);
    case GET_TRANSACTIONS_FAIL:
      return state;
    default:
      return state;
  }
};

export default transactions;
