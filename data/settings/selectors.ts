import { createSelector } from "reselect";
import { FullState } from "../store";

const settingsSelector = (state: FullState) => state.settings;

const tokenBlacklistSelector = createSelector(settingsSelector, settings => {
  return settings.tokenBlacklist;
});

export { settingsSelector, tokenBlacklistSelector };
