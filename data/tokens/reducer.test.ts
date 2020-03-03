import tokensReducer, { initialState } from "./reducer";
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
    it("updates a single tokens metadata", () => {});
    it("updates multiple tokens metadata at a time", () => {});
    it("does not add a token multiple times and handles null values", () => {});
  });
});
