import {
  UPDATE_TOKENS_META_START,
  UPDATE_TOKENS_META_FAIL,
  UPDATE_TOKENS_META_SUCCESS
} from "./constants";

describe("tokens::constants", () => {
  it("UPDATE_TOKENS_META_START defined", () => {
    expect(UPDATE_TOKENS_META_START).toBeDefined();
  });

  it("UPDATE_TOKENS_META_FAIL defined", () => {
    expect(UPDATE_TOKENS_META_FAIL).toBeDefined();
  });

  it("UPDATE_TOKENS_META_SUCCESS defined", () => {
    expect(UPDATE_TOKENS_META_SUCCESS).toBeDefined();
  });
});
