import pricesReducer, { initialState } from "./reducer";
import {
  updateSpotPriceSuccess,
  updateSpotPriceStart,
  updateSpotPriceFail,
  setFiatCurrency
} from "./actions";

describe("prices::reducer", () => {
  it("should return the initial state", () => {
    expect(pricesReducer(undefined, { type: "__init", payload: null })).toEqual(
      initialState
    );
  });

  it("should handle starting price by doing nothing", () => {
    const stateBefore = initialState;
    const stateAfter = pricesReducer(stateBefore, updateSpotPriceStart());

    const expectedState = initialState;
    expect(stateAfter).toEqual(expectedState);
  });

  it("should handle updating spot price success - new currency", () => {
    const stateBefore = initialState;
    const now = +new Date();
    const stateAfter = pricesReducer(
      stateBefore,
      updateSpotPriceSuccess("CHF", 500, now)
    );

    const expectedState = {
      ...initialState,
      spot: {
        bch: {
          ...initialState.spot.bch,
          CHF: {
            rate: 500,
            lastUpdated: now
          }
        }
      }
    };
    expect(stateAfter).toEqual(expectedState);
  });

  it("should handle updating spot price success - over initial currency", () => {
    const stateBefore = initialState;
    const now = +new Date();
    const stateAfter = pricesReducer(
      stateBefore,
      updateSpotPriceSuccess("USD", 500, now)
    );

    // In this case no existing bch rate to preserve
    const expectedState = {
      ...initialState,
      spot: {
        bch: {
          USD: {
            rate: 500,
            lastUpdated: now
          }
        }
      }
    };
    expect(stateAfter).toEqual(expectedState);
  });

  it("should handle updating spot price fail", () => {
    const stateBefore = initialState;
    const now = +new Date();
    const stateAfter = pricesReducer(
      stateBefore,
      updateSpotPriceFail("CHF", now)
    );

    const expectedState = {
      ...initialState,
      spot: {
        bch: {
          ...initialState.spot.bch,
          CHF: {
            rate: null,
            lastUpdated: now
          }
        }
      }
    };
    expect(stateAfter).toEqual(expectedState);
  });

  it("should handle changing fiat currency", () => {
    const stateBefore = initialState;
    const stateAfter = pricesReducer(stateBefore, setFiatCurrency("CHF"));

    const expectedState = {
      ...initialState,
      currencySelected: "CHF"
    };

    expect(stateAfter).toEqual(expectedState);
  });
});
