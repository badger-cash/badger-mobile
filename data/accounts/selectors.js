// @flow

import { createSelector } from "reselect";

const accountsSelector = state => state.accounts;

const activeAccountSelector = createSelector(
  accountsSelector,
  accounts => {
    const { byId, activeId } = accounts;
    return byId[activeId];
  }
);

const activeAccountIdSelector = state => state.accounts.activeId;

// For if we only support 1 account.  Probably can remove
const mainAccountSelector = createSelector(
  accountsSelector,
  accounts => {
    const { byId, allIds } = accounts;
    const firstId = allIds[0];

    const mainAccount = byId[firstId];
    return mainAccount;
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
  getMnemonicSelector,
  mainAccountSelector
};
