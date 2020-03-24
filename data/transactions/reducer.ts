import { AnyAction } from "redux";

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

// Transaction shape in redux store
export type Transaction = {
  hash: string;
  txParams: {
    from?: string | null;
    to: string | null;
    transactionType?: string;
    fromAddresses: string[];
    toAddresses: string[];
    value?: string;
    valueBch: number;
    sendTokenData?: {
      tokenProtocol: "slp";
      tokenId: string;
      valueToken: string;
    };
  };
  time: number;
  block: number;
  networkId: "mainnet" | "testnet";
};

export type State = {
  byId: {
    [transactionId: string]: Transaction;
  };
  allIds: string[];
  byAccount: {
    [accountId: string]: string[];
  };
  updating: boolean;
  lastUpdate: number;
};

export const initialState: State = {
  byId: {},
  allIds: [],
  byAccount: {},
  updating: false,
  lastUpdate: +new Date()
};

const addTransactions = (
  state: State,
  payload: {
    transactions: Transaction[];
    address: string;
    timestamp: number;
  }
) => {
  const { transactions, address, timestamp } = payload;

  const transactionsById = transactions.reduce((acc, tx) => {
    return {
      ...acc,
      [tx.hash]: tx
    };
  }, {});

  const txIds = transactions.map(tx => tx.hash);

  const existingAccountTxs = state.byAccount[address] || [];
  const nextAccountTxs = new Set([...existingAccountTxs, ...txIds]);

  return {
    ...state,
    byId: {
      ...state.byId,
      ...transactionsById
    },
    byAccount: {
      ...state.byAccount,
      [address]: [...nextAccountTxs]
    },
    allIds: [...new Set([...state.allIds, ...txIds])],
    updating: false,
    lastUpdate: timestamp
  };
};

const transactions = (
  state: State = initialState,
  action: AnyAction
): State => {
  switch (action.type) {
    case GET_TRANSACTIONS_START:
      return {
        ...state,
        updating: true
      };

    case GET_TRANSACTIONS_SUCCESS:
      return addTransactions(state, action.payload);

    case GET_TRANSACTIONS_FAIL:
      return state;

    default:
      return state;
  }
};

export default transactions;
