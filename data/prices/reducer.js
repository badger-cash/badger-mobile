// @flow

import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL
} from "./constants";

export type State = {
  spot: {
    [coinId: string]: {
      [currency: string]: { rate: ?number, lastUpdated: ?number }
    }
  }
};

type Action = { type: string, payload: any };

export const initialState = {
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

const prices = (state: State = initialState, action: Action) => {
  switch (action.type) {
    case UPDATE_BCH_SPOT_PRICE_START:
      return state;
    case UPDATE_BCH_SPOT_PRICE_SUCCESS:
      return updateSpotRate(state, action.payload);
    case UPDATE_BCH_SPOT_PRICE_FAIL:
      return state;
    default:
      return state;
  }
};

export default prices;
