import {
  ADD_ACCOUNT,
  GET_ACCOUNT_START,
  GET_ACCOUNT_FAIL,
  GET_ACCOUNT_SUCCESS,
  LOGOUT_ACCOUNT,
  VIEW_SEED
} from "./constants";

describe("accounts::constants", () => {
  it("ADD_ACCOUNT defined", () => {
    expect(ADD_ACCOUNT).toBeDefined();
  });

  it("GET_ACCOUNT_START defined", () => {
    expect(GET_ACCOUNT_START).toBeDefined();
  });

  it("GET_ACCOUNT_FAIL defined", () => {
    expect(GET_ACCOUNT_FAIL).toBeDefined();
  });

  it("GET_ACCOUNT_SUCCESS defined", () => {
    expect(GET_ACCOUNT_SUCCESS).toBeDefined();
  });

  it("LOGOUT_ACCOUNT defined", () => {
    expect(LOGOUT_ACCOUNT).toBeDefined();
  });

  it("VIEW_SEED defined", () => {
    expect(VIEW_SEED).toBeDefined();
  });
});
