import settingsReducer, { initialState } from "./reducer";
import { addTokenToFavorites, removeTokenFromFavorites } from "./actions";

describe("settings::reducer", () => {
  it("should return the initial state", () => {
    expect(
      settingsReducer(undefined, { type: "__init", payload: null })
    ).toEqual(initialState);
  });

  describe("handles adding tokens to favorites", () => {
    it("adds a token to favorites", () => {
      const stateBefore = { ...initialState };
      const stateAfter = settingsReducer(
        stateBefore,
        addTokenToFavorites("tokenId")
      );

      const expectedState = { ...initialState, tokenFavorites: ["tokenId"] };
      expect(stateAfter).toEqual(expectedState);
    });

    it("adds a token only once", () => {
      const stateBefore = { ...initialState };
      const stateAfter1 = settingsReducer(
        stateBefore,
        addTokenToFavorites("tokenId")
      );
      const stateAfter2 = settingsReducer(
        stateAfter1,
        addTokenToFavorites("tokenId")
      );

      const expectedState = { ...initialState, tokenFavorites: ["tokenId"] };
      expect(stateAfter2).toEqual(expectedState);
    });
  });

  describe("handles removing token from favorites", () => {
    it("removes a token from favorites", () => {
      const stateBefore = {
        ...initialState,
        tokenFavorites: ["tokenId1", "tokenId2"]
      };
      const stateAfter = settingsReducer(
        stateBefore,
        removeTokenFromFavorites("tokenId2")
      );

      const expectedState = { ...initialState, tokenFavorites: ["tokenId1"] };
      expect(stateAfter).toEqual(expectedState);
    });

    it("does nothing if the token is not in favorites", () => {
      const stateBefore = {
        ...initialState,
        tokenFavorites: ["tokenId1", "tokenId2"]
      };
      const stateAfter = settingsReducer(
        stateBefore,
        removeTokenFromFavorites("tokenId3")
      );

      const expectedState = {
        ...initialState,
        tokenFavorites: ["tokenId1", "tokenId2"]
      };
      expect(stateAfter).toEqual(expectedState);
    });
  });
});
