import { createSelector } from "reselect";
import { FullState } from "../store";

const settingsSelector = (state: FullState) => state.settings;

const tokenBlackListSelector = createSelector(settingsSelector, settings => {
  return settings.tokenBlacklist;
});

export { settingsSelector, tokenBlackListSelector };
