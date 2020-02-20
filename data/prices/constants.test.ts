import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL,
  SET_FIAT_CURRENCY
} from "./constants";

describe("prices::constants", () => {
  it("UPDATE_BCH_SPOT_PRICE_START defined", () => {
    expect(UPDATE_BCH_SPOT_PRICE_START).toBeDefined();
  });

  it("UPDATE_BCH_SPOT_PRICE_SUCCESS defined", () => {
    expect(UPDATE_BCH_SPOT_PRICE_SUCCESS).toBeDefined();
  });

  it("UPDATE_BCH_SPOT_PRICE_FAIL defined", () => {
    expect(UPDATE_BCH_SPOT_PRICE_FAIL).toBeDefined();
  });

  it("SET_FIAT_CURRENCY defined", () => {
    expect(SET_FIAT_CURRENCY).toBeDefined();
  });
});
