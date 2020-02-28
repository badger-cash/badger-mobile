import { currencySelector, spotPricesSelector } from "./selectors";
import { FullState } from "../store";

describe("price::selectors", () => {
  describe("currencySelector", () => {
    it("returns the current active fiat currency", () => {
      const state = { prices: { currencySelected: "CHF" } } as FullState;
      expect(currencySelector(state)).toEqual("CHF");
    });
  });

  describe("spotPricesSelector", () => {
    it("returns all of the spot price data", () => {
      const spotData = {
        bch: {
          USD: {
            rate: null,
            lastUpdated: null
          },
          CHF: {
            rate: 500,
            lastUpdated: +new Date()
          }
        }
      };

      const state = ({
        prices: {
          spot: spotData
        }
      } as unknown) as FullState;

      expect(spotPricesSelector(state)).toEqual(spotData);
    });
  });
});
