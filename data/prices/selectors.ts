import { createSelector } from "reselect";

import { FullState } from "../store";

const pricesSelector = (state: FullState) => state.prices;

const currencySelector = createSelector(pricesSelector, prices => {
  return prices.currencySelected;
});

// TODO - Create selectors to get specific amounts for currencies and coins.  Less logic in view layer.
const spotPricesSelector = createSelector(pricesSelector, prices => {
  return prices.spot;
});

export { currencySelector, spotPricesSelector };
