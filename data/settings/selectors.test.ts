import { settingsSelector, tokenFavoritesSelector } from "./selectors";
import { FullState } from "../store";

describe("settings::selectors", () => {
  it("selector for setting slice", () => {
    const settingsSlice = { anything: "here" };
    const state = ({ settings: settingsSlice } as unknown) as FullState;

    expect(settingsSelector(state)).toEqual(settingsSlice);
  });

  it("selector for favorite tokens", () => {
    const tokenFavorites = ["tokenId1", "tokenId2"];
    const state = ({ settings: { tokenFavorites } } as unknown) as FullState;

    expect(tokenFavoritesSelector(state)).toEqual(tokenFavorites);
  });
});
