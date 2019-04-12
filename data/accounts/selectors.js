// @flow

import { createSelector } from "reselect";
import { type FullState } from "../store";

const accountsSelector = (state: FullState) => state.accounts;
const accountsByIdSelector = (state: FullState) => state.accounts.byId;
const activeAccountIdSelector = (state: FullState) => state.accounts.activeId;

const activeAccountSelector = createSelector(
  accountsByIdSelector,
  activeAccountIdSelector,
  (byId, activeId) => {
    return activeId ? byId[activeId] : null;
  }
);

const hasMnemonicSelector = createSelector(
  activeAccountSelector,
  account => {
    return account && account.mnemonic && true;
  }
);

const getMnemonicSelector = createSelector(
  activeAccountSelector,
  account => {
    return account ? account.mnemonic : "";
  }
);

const getAddressSelector = createSelector(
  activeAccountSelector,
  account => {
    return account && account.address;
  }
);

const getAddressSlpSelector = createSelector(
  activeAccountSelector,
  account => {
    return account && account.addressSlp;
  }
);

export {
  activeAccountSelector,
  activeAccountIdSelector,
  hasMnemonicSelector,
  getAddressSelector,
  getAddressSlpSelector,
  getMnemonicSelector
};
