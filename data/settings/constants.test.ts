import {
  ADD_TOKEN_TO_FAVORITES,
  REMOVE_TOKEN_FROM_FAVORITES
} from "./constants";

describe("settings::constants", () => {
  it("ADD_TOKEN_TO_FAVORITES defined", () => {
    expect(ADD_TOKEN_TO_FAVORITES).toBeDefined();
  });

  it("REMOVE_TOKEN_FROM_FAVORITES defined", () => {
    expect(REMOVE_TOKEN_FROM_FAVORITES).toBeDefined();
  });
});
