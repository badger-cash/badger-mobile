import accountsReducer, { initialState, Account, State } from "./reducer";

import {
  getAccount,
  getAccountStart,
  getAccountFail,
  getAccountSuccess,
  viewSeed,
  logoutAccount
} from "./actions";

describe("accounts::reducer", () => {
  it("should return the initial state", () => {
    expect(
      accountsReducer(undefined, { type: "__init", payload: null })
    ).toEqual(initialState);
  });

  describe("get account - start", () => {
    it("does not modify state", () => {
      const stateBefore = { ...initialState };
      const stateAfter = accountsReducer(stateBefore, getAccountStart());
      expect(stateBefore).toEqual(stateAfter);
    });
  });

  describe("get account - fail", () => {
    it.todo("handle the account fail case");
  });

  describe("get account - success", () => {
    it("adds the new account to the store, normalized", () => {
      const stateBefore = { ...initialState };

      const dummyKeypairData = { data: "keypairData" };
      const otherData = { arbitrary: "values" };

      const account = ({
        address: "bchAccountAddress",
        otherData,
        keypair: dummyKeypairData
      } as unknown) as Account;
      const accountSlp = ({
        address: "slpAccountAddress",
        keypair: dummyKeypairData
      } as unknown) as Account;
      const isNew = true;

      const combinedAccount = {
        address: "bchAccountAddress",
        addressSlp: "slpAccountAddress",
        otherData,
        seedViewed: false
      };

      const stateAfter = accountsReducer(
        stateBefore,
        getAccountSuccess(account, accountSlp, isNew)
      );

      const stateExpected = {
        byId: {
          bchAccountAddress: combinedAccount
        },
        keypairsByAccount: {
          bchAccountAddress: {
            bch: dummyKeypairData,
            slp: dummyKeypairData
          }
        },
        allIds: ["bchAccountAddress"],
        activeId: "bchAccountAddress"
      };

      expect(stateAfter).toEqual(stateExpected);
    });

    it("only adds an account once", () => {
      const stateBefore = { ...initialState };

      const dummyKeypairData = { data: "keypairData" };
      const otherData = { arbitrary: "values" };

      const account = ({
        address: "bchAccountAddress",
        otherData,
        keypair: dummyKeypairData
      } as unknown) as Account;
      const accountSlp = ({
        address: "slpAccountAddress",
        keypair: dummyKeypairData
      } as unknown) as Account;
      const isNew = true;

      const combinedAccount = {
        address: "bchAccountAddress",
        addressSlp: "slpAccountAddress",
        otherData,
        seedViewed: false
      };

      const stateExpected = {
        byId: {
          bchAccountAddress: combinedAccount
        },
        keypairsByAccount: {
          bchAccountAddress: {
            bch: dummyKeypairData,
            slp: dummyKeypairData
          }
        },
        allIds: ["bchAccountAddress"],
        activeId: "bchAccountAddress"
      };

      // add once
      const stateAfterOnce = accountsReducer(
        stateBefore,
        getAccountSuccess(account, accountSlp, isNew)
      );
      expect(stateAfterOnce).toEqual(stateExpected);

      // add again, changing the isNew value
      const stateAfterTwice = accountsReducer(
        stateAfterOnce,
        getAccountSuccess(account, accountSlp, isNew)
      );
      expect(stateAfterTwice).toEqual(stateExpected);
    });
  });

  describe("logout account", () => {
    it("resets to initial state, clearing all accounts", () => {
      const stateBefore = {
        ...initialState,
        literally: "anything",
        can: "be here"
      };
      const expectedState = { ...initialState };

      const stateAfter = accountsReducer(stateBefore, logoutAccount());
      expect(stateAfter).toEqual(expectedState);
    });
  });

  describe("view seed phrase", () => {
    it("sets seed viewed on the account to true", () => {
      const stateBefore = ({
        ...initialState,
        byId: { bchAddress: { seedViewed: false } }
      } as unknown) as State;
      const stateAfter = accountsReducer(stateBefore, viewSeed("bchAddress"));

      const stateExpected = {
        ...initialState,
        byId: { bchAddress: { seedViewed: true } }
      };

      expect(stateAfter).toEqual(stateExpected);
    });

    it("does nothing if already true", () => {
      const stateBefore = ({
        ...initialState,
        byId: { bchAddress: { seedViewed: true } }
      } as unknown) as State;
      const stateAfter = accountsReducer(stateBefore, viewSeed("bchAddress"));

      expect(stateAfter).toEqual(stateBefore);
    });
  });
});
