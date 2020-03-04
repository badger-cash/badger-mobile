import tokensReducer, { initialState, TokenData } from "./reducer";
import {
  updateTokensMetaStart,
  updateTokensMetaSuccess,
  updateTokensMetaFail
} from "./actions";

describe("tokens::reducer", () => {
  it("should return the initial state", () => {
    expect(tokensReducer(undefined, { type: "__init", payload: null })).toEqual(
      initialState
    );
  });

  it("handles token metadata start by setting updating to true", () => {
    const stateBefore = { ...initialState };
    const stateAfter = tokensReducer(stateBefore, updateTokensMetaStart());

    const expectedState = { ...initialState, updating: true };
    expect(stateAfter).toEqual(expectedState);
  });

  it("handles token metadata fail by doing nothing", () => {
    const stateBefore = { ...initialState };
    const stateAfter = tokensReducer(stateBefore, updateTokensMetaFail());

    const expectedState = { ...initialState };
    expect(stateAfter).toEqual(expectedState);
  });

  describe("updating token metadata success", () => {
    it("updates a single tokens metadata", () => {
      const stateBefore = { ...initialState };

      const tokenData: TokenData[] = [
        {
          tokenId:
            "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
          symbol: "LEAD",
          name: "LEAD Token (Leaders of Education Adoption and Development)",
          decimals: 2,
          protocol: "slp"
        }
      ];

      const stateAfter = tokensReducer(
        stateBefore,
        updateTokensMetaSuccess(tokenData)
      );

      const expectedState = {
        ...initialState,
        byId: {
          "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006": {
            tokenId:
              "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
            symbol: "LEAD",
            name: "LEAD Token (Leaders of Education Adoption and Development)",
            decimals: 2,
            protocol: "slp"
          }
        },
        allIds: [
          "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006"
        ],
        updating: false
      };

      expect(stateAfter).toEqual(expectedState);

      // Confirm adding same token again does not change anything
      const stateAfter2 = tokensReducer(
        stateAfter,
        updateTokensMetaSuccess(tokenData)
      );
      expect(stateAfter2).toEqual(expectedState);
    });
    it("updates multiple tokens metadata at a time", () => {
      const stateBefore = { ...initialState };

      const tokenData: TokenData[] = [
        {
          tokenId:
            "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
          symbol: "LEAD",
          name: "LEAD Token (Leaders of Education Adoption and Development)",
          decimals: 2,
          protocol: "slp"
        },
        {
          tokenId:
            "f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec",
          symbol: "zBCH",
          name: "Zurich BCH Meetup Token",
          decimals: 8,
          protocol: "slp"
        }
      ];

      const stateAfter = tokensReducer(
        stateBefore,
        updateTokensMetaSuccess(tokenData)
      );

      const expectedState = {
        ...initialState,
        byId: {
          "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006": {
            tokenId:
              "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
            symbol: "LEAD",
            name: "LEAD Token (Leaders of Education Adoption and Development)",
            decimals: 2,
            protocol: "slp"
          },
          f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec: {
            tokenId:
              "f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec",
            symbol: "zBCH",
            name: "Zurich BCH Meetup Token",
            decimals: 8,
            protocol: "slp"
          }
        },
        allIds: [
          "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
          "f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec"
        ],
        updating: false
      };

      expect(stateAfter).toEqual(expectedState);
    });

    it("does nothing if an empty array of tokens is passed in", () => {
      const stateBefore = { ...initialState };
      const stateAfter = tokensReducer(
        stateBefore,
        updateTokensMetaSuccess([])
      );

      const expectedState = { ...initialState };
      expect(stateAfter).toEqual(expectedState);
    });
  });
});
