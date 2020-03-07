import transactionsReducer, { initialState, Transaction } from "./reducer";
import {
  getTransactionsStart,
  getTransactionsFail,
  getTransactionsSuccess
} from "./actions";

describe("transactions::reducer", () => {
  it("should return the initial state", () => {
    expect(
      transactionsReducer(undefined, { type: "__init", payload: null })
    ).toEqual(initialState);
  });

  it("handles update start", () => {
    const stateBefore = { ...initialState };
    const stateAfter = transactionsReducer(stateBefore, getTransactionsStart());

    const expectedState = { ...initialState, updating: true };
    expect(stateAfter).toEqual(expectedState);
  });

  it("handles update fail by doing nothing", () => {
    const stateBefore = { ...initialState };
    const stateAfter = transactionsReducer(stateBefore, getTransactionsFail());

    const expectedState = { ...initialState };
    expect(stateAfter).toEqual(expectedState);
  });

  describe("transaction update success", () => {
    it("adds new transactions to the store, normalized", () => {
      const stateBefore = { ...initialState };
      const now = +new Date();

      const transaction1 = ({
        hash: "someTxHash",
        time: now,
        block: 1001,
        networkId: "unit-test",
        txParams: {
          arbitrary: "values"
        }
      } as unknown) as Transaction;

      const newTransactions = [transaction1];
      const address = "bchAddress";
      const stateAfter = transactionsReducer(
        stateBefore,
        getTransactionsSuccess(newTransactions, address, now)
      );

      const expectedState = {
        ...initialState,
        allIds: ["someTxHash"],
        byId: {
          someTxHash: transaction1
        },
        byAccount: {
          bchAddress: ["someTxHash"]
        },
        updating: false,
        lastUpdate: now
      };

      expect(stateAfter).toEqual(expectedState);
    });

    it("updates a transaction if it already exists, and adds multiple at a time", () => {
      const now = +new Date();

      const transaction1 = ({
        hash: "someTxHash",
        time: now,
        block: 1001,
        networkId: "unit-test",
        txParams: {
          arbitrary: "values"
        }
      } as unknown) as Transaction;

      const transaction1Updated = ({
        ...transaction1,
        block: 1337
      } as unknown) as Transaction;

      const transaction2 = ({
        hash: "someTxHash2",
        time: now,
        block: 1002,
        networkId: "unit-test",
        txParams: {
          arbitrary: "values"
        }
      } as unknown) as Transaction;

      const stateBefore = {
        ...initialState,
        allIds: ["someTxHash"],
        byId: {
          someTxHash: transaction1
        },
        byAccount: {
          bchAddress: ["someTxHash"]
        },
        updating: false,
        lastUpdate: now
      };

      const newTransactions = [transaction1Updated, transaction2];
      const address = "bchAddress";
      const stateAfter = transactionsReducer(
        stateBefore,
        getTransactionsSuccess(newTransactions, address, now)
      );

      const expectedState = {
        ...initialState,
        allIds: ["someTxHash", "someTxHash2"],
        byId: {
          someTxHash: transaction1Updated,
          someTxHash2: transaction2
        },
        byAccount: {
          bchAddress: ["someTxHash", "someTxHash2"]
        },
        updating: false,
        lastUpdate: now
      };

      expect(stateAfter).toEqual(expectedState);
    });
  });
});
