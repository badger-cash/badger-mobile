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
  activeAccountSelector,
  hasMnemonicSelector,
  getAddressSelector,
  getMnemonicSelector,
  mainAccountSelector
};
