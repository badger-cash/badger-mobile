import { createSelector } from "reselect";
import { FullState } from "../store";

const settingsSelector = (state: FullState) => state.settings;

const tokenFavoritesSelector = createSelector(settingsSelector, settings => {
  return settings.tokenFavorites;
});

export { settingsSelector, tokenFavoritesSelector };
