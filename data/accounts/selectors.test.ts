import {
  activeAccountIdSelector,
  accountsByIdSelector,
  activeAccountSelector,
  getAddressSelector,
  getAddressSlpSelector,
  getKeypairSelector,
  getMnemonicSelector,
  hasMnemonicSelector,
  getSeedViewedSelector
} from "./selectors";
import { initialState, State, Account, ECPair } from "./reducer";
import { FullState } from "../store";

describe("accounts::selectors", () => {
  describe("activeAccountIdSelector", () => {
    it("returns the active account id", () => {
      const accountsState = {
        ...initialState,
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;
      expect(activeAccountIdSelector(state)).toEqual("bchAddress");
    });
  });

  describe("accountsByIdSelector", () => {
    it("returns all accounts indexed by their address (id)", () => {
      const account1 = ({
        address: "account1",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const account2 = ({
        address: "account2",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { account1, account2 }
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(accountsByIdSelector(state)).toEqual({ account1, account2 });
    });
  });

  describe("activeAccountSelector", () => {
    it("returns the active account", () => {
      const account1 = ({
        address: "account1",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const account2 = ({
        address: "account2",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { account1, account2 },
        activeId: "account2"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(activeAccountSelector(state)).toEqual(account2);
    });
  });

  describe("getAddressSelector", () => {
    it("returns the active account bch address", () => {
      const account = ({
        address: "bchAddress",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getAddressSelector(state)).toEqual("bchAddress");
    });
  });

  describe("getAddressSlpSelector", () => {
    it("returns the active account slp address", () => {
      const account = ({
        address: "bchAddress",
        addressSlp: "slpAddress"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getAddressSlpSelector(state)).toEqual("slpAddress");
    });
  });
  describe("getKeypairSelector", () => {
    it("returns the active account keypair object", () => {
      const keypair = {
        bch: ({ nested: "values" } as unknown) as ECPair,
        slp: ({ more: "values" } as unknown) as ECPair
      };

      const account = ({ address: "bchAddress" } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        keypairsByAccount: { bchAddress: keypair },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getKeypairSelector(state)).toEqual(keypair);
    });
  });

  describe("getMnemonicSelector", () => {
    it("returns the active account mnemonic", () => {
      const account = ({
        address: "bchAddress",
        mnemonic: "horse battery staple"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getMnemonicSelector(state)).toEqual("horse battery staple");
    });

    it("returns undefined if not present", () => {
      const account = ({ address: "bchAddress" } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getMnemonicSelector(state)).toBeUndefined();
    });
  });

  describe("hasMnemonicSelector", () => {
    it("returns true if the activeAccount has a mnemonic set", () => {
      const account = ({
        address: "bchAddress",
        mnemonic: "secret"
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(hasMnemonicSelector(state)).toEqual(true);
    });

    it("returns false if the activeAccount does not have a mnemonic", () => {
      const account = ({ address: "bchAddress" } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(hasMnemonicSelector(state)).toEqual(false);
    });
  });

  describe("getSeedViewedSelector", () => {
    it("returns true if the seedView is true", () => {
      const account = ({
        address: "bchAddress",
        seedViewed: true
      } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getSeedViewedSelector(state)).toEqual(true);
    });

    it("is undefined if not set", () => {
      const account = ({ address: "bchAddress" } as unknown) as Account;
      const accountsState = {
        ...initialState,
        byId: { bchAddress: account },
        activeId: "bchAddress"
      } as State;
      const state = ({ accounts: accountsState } as unknown) as FullState;

      expect(getSeedViewedSelector(state)).toBeUndefined();
    });
  });
});
