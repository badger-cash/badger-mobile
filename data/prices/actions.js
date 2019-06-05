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

// For now assume BCH
const updateSpotPrice = (currencyCode: CurrencyCode) => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(updateSpotPriceStart());

    const rate = await SLP.Price.current(currencyCode);

    // API always returns as if currency has 2 decimals, even if it has none such as the JPY
    const decimalAdjustedRate = rate / Math.pow(10, 2);
    // const decimalAdjustedRate =
    //   rate / Math.pow(10, currencyDecimalMap[currencyCode]);

    dispatch(updateSpotPriceSuccess(currencyCode, decimalAdjustedRate));
  };
};

export { updateSpotPrice, setFiatCurrency };
