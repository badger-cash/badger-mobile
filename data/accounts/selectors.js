// @flow

import { createSelector } from "reselect";

const accountsSelector = state => state.accounts;

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
  mainAccountSelector,
  account => {
    return account && account.mnemonic && true;
  }
);

const getMnemonicSelector = createSelector(
  mainAccountSelector,
  account => {
    return account ? account.mnemonic : "";
  }
);

const getAddressSelector = createSelector(
  mainAccountSelector,
  account => {
    return account && account.address;
  }
);

export {
  hasMnemonicSelector,
  getAddressSelector,
  getMnemonicSelector,
  mainAccountSelector
};
