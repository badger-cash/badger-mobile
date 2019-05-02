// @flow

import SLPSDK from "slp-sdk";

import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL
} from "./constants";

const SLP = new SLPSDK();

const updateSpotPriceStart = () => ({
  type: UPDATE_BCH_SPOT_PRICE_START,
  payload: null
});

const updateSpotPriceSuccess = (currency: "usd", rate: number) => ({
  type: UPDATE_BCH_SPOT_PRICE_SUCCESS,
  payload: { currency, rate }
});

const updateSpotPriceFail = () => ({
  type: UPDATE_BCH_SPOT_PRICE_FAIL,
  payload: null
});

// For now assumes BCH and USD.  Add arguments to extend this
const updateSpotPrice = () => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(updateSpotPriceStart());

    const rate = await SLP.Price.current("usd");
    dispatch(updateSpotPriceSuccess("usd", rate / 100));
  };
};

export { updateSpotPrice };
