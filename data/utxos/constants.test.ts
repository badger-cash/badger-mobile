import {
  UPDATE_UTXO_START,
  UPDATE_UTXO_SUCCESS,
  UPDATE_UTXO_FAIL
} from "./constants";

describe("UTXO::constants", () => {
  it("UPDATE_UTXO_START defined", () => {
    expect(UPDATE_UTXO_START).toBeDefined();
  });

  it("UPDATE_UTXO_SUCCESS defined", () => {
    expect(UPDATE_UTXO_SUCCESS).toBeDefined();
  });
  it("UPDATE_UTXO_FAIL defined", () => {
    expect(UPDATE_UTXO_FAIL).toBeDefined();
  });
});
