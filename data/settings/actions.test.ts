import { addTokenToFavorites, removeTokenFromFavorites } from "./actions";
import * as actionTypes from "./constants";

describe("settings::actions", () => {
  it("creates an action for adding a favorite token", () => {
    const tokenId = "tokenId";
    const expectedAction = {
      type: actionTypes.ADD_TOKEN_TO_FAVORITES,
      payload: tokenId
    };
    expect(addTokenToFavorites(tokenId)).toEqual(expectedAction);
  });

  it("creates an action for removing a favorite token", () => {
    const tokenId = "tokenId";
    const expectedAction = {
      type: actionTypes.REMOVE_TOKEN_FROM_FAVORITES,
      payload: tokenId
    };
    expect(removeTokenFromFavorites(tokenId)).toEqual(expectedAction);
  });
});
