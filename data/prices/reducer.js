// @flow

import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL,
  SET_FIAT_CURRENCY
} from "./constants";

export type State = {
  currencySelected: string,
  spot: {
    [coinId: string]: {
      [currency: string]: { rate: ?number, lastUpdated: ?number }
    }
  }
};

type Action = { type: string, payload: any };

export const initialState = {
  currencySelected: "USD",
  spot: {
    bch: { usd: { rate: null, lastUpdated: null } }
  }
};

const updateSpotRate = (
  state,
  { currency, rate }: { currency: string, rate: number }
) => {
  const now = +new Date();
  return {
    ...state,
    spot: {
      ...state.spot,
      bch: { ...state.spot.bch, [currency]: { rate, lastUpdated: now } }
    }
  };
};

const updateFiatCurrency = (state: State, currencyCode: string) => {
  return { ...state, currencySelected: currencyCode };
};

const prices = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case UPDATE_BCH_SPOT_PRICE_START:
      return state;
    case UPDATE_BCH_SPOT_PRICE_SUCCESS:
      return updateSpotRate(state, action.payload);
    case UPDATE_BCH_SPOT_PRICE_FAIL:
      return state;
    case SET_FIAT_CURRENCY:
      return updateFiatCurrency(state, action.payload);
    default:
      return state;
  }
};

export default prices;
