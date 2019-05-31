// @flow

import SLPSDK from "slp-sdk";

import {
  currencyDecimalMap,
  type CurrencyCode
} from "../../utils/currency-utils";

import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL,
  SET_FIAT_CURRENCY
} from "./constants";

const SLP = new SLPSDK();

const setFiatCurrency = (currencyCode: string) => ({
  type: SET_FIAT_CURRENCY,
  payload: currencyCode
});

const updateSpotPriceStart = () => ({
  type: UPDATE_BCH_SPOT_PRICE_START,
  payload: null
});

const updateSpotPriceSuccess = (currency: CurrencyCode, rate: number) => ({
  type: UPDATE_BCH_SPOT_PRICE_SUCCESS,
  payload: { currency, rate }
});

const updateSpotPriceFail = () => ({
  type: UPDATE_BCH_SPOT_PRICE_FAIL,
  payload: null
});

// For now assumes BCH and USD.  Add arguments to extend this
const updateSpotPrice = (currencyCode: CurrencyCode) => {
  return async (dispatch: Function, getState: Function) => {
    console.log("udpdate spot");
    console.log(currencyCode);
    dispatch(updateSpotPriceStart());

    const rate = await SLP.Price.current(currencyCode);

    console.log(rate);

    const decimalAdjustedRate =
      rate / Math.pow(10, currencyDecimalMap[currencyCode]);

    dispatch(updateSpotPriceSuccess(currencyCode, decimalAdjustedRate));
  };
};

export { updateSpotPrice };
