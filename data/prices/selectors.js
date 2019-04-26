// @flow

import { createSelector } from "reselect";

const pricesSelector = state => state.prices;

// TODO - Create selectors to get specific amounts for currencies and coins.  Less logic in view layer.
const spotPricesSelector = createSelector(
  pricesSelector,
  prices => {
    return prices.spot;
  }
);

export { spotPricesSelector };
