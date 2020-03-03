import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_FAIL,
  GET_TRANSACTIONS_SUCCESS
} from "./constants";

describe("transactions::constants", () => {
  it("GET_TRANSACTIONS_START defined", () => {
    expect(GET_TRANSACTIONS_START).toBeDefined();
  });

  it("GET_TRANSACTIONS_FAIL defined", () => {
    expect(GET_TRANSACTIONS_FAIL).toBeDefined();
  });

  it("GET_TRANSACTIONS_SUCCESS defined", () => {
    expect(GET_TRANSACTIONS_SUCCESS).toBeDefined();
  });
});
