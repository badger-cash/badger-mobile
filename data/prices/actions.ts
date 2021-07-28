import { AnyAction } from "redux";
import { ThunkDispatch } from "redux-thunk";

import { CurrencyCode } from "../../utils/currency-utils";
import { getPrice } from "../../api/api.bitcoin.com";

import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL,
  SET_FIAT_CURRENCY
} from "./constants";
import { FullState } from "../store";

const setFiatCurrency = (currencyCode: string) => ({
  type: SET_FIAT_CURRENCY,
  payload: currencyCode
});

const updateSpotPriceStart = () => ({
  type: UPDATE_BCH_SPOT_PRICE_START,
  payload: null
});

const updateSpotPriceSuccess = (
  currencyCode: CurrencyCode,
  rate: number,
  timestamp: number
) => ({
  type: UPDATE_BCH_SPOT_PRICE_SUCCESS,
  payload: {
    currency: currencyCode,
    rate,
    timestamp
  }
});

const updateSpotPriceFail = (
  currencyCode: CurrencyCode,
  timestamp: number
) => ({
  type: UPDATE_BCH_SPOT_PRICE_FAIL,
  payload: {
    currency: currencyCode,
    timestamp
  }
});

// For now assume BCH
const updateSpotPrice = (currencyCode: CurrencyCode) => {
  return async (
    dispatch: ThunkDispatch<FullState, null, AnyAction>,
    getState: () => FullState
  ) => {
    dispatch(updateSpotPriceStart());
    try {
      const rate = await getPrice(currencyCode);

      // API always returns as if currency has 2 decimals, even if it has none such as the JPY
      const decimalAdjustedRate = rate / Math.pow(10, 2);
      const now = +new Date();
      // const decimalAdjustedRate =
      //   rate / Math.pow(10, currencyDecimalMap[currencyCode]);

      dispatch(updateSpotPriceSuccess(currencyCode, decimalAdjustedRate, now));
    } catch {
      const now = +new Date();
      dispatch(updateSpotPriceFail(currencyCode, now));
    }
  };
};

export {
  updateSpotPrice,
  updateSpotPriceSuccess,
  updateSpotPriceStart,
  updateSpotPriceFail,
  setFiatCurrency
};
