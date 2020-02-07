import {
  UPDATE_BCH_SPOT_PRICE_START,
  UPDATE_BCH_SPOT_PRICE_SUCCESS,
  UPDATE_BCH_SPOT_PRICE_FAIL,
  SET_FIAT_CURRENCY
} from "./constants";

import { CurrencyCode } from "../../utils/currency-utils";

export type State = {
  currencySelected: CurrencyCode;
  spot: {
    [coinId: string]: {
      [currency: string]: {
        rate?: number | null;
        lastUpdated?: number | null;
      };
    };
  };
};

type Action = {
  type: string;
  payload: any;
};

export const initialState: State = {
  currencySelected: "USD",
  spot: {
    bch: {
      usd: {
        rate: null,
        lastUpdated: null
      }
    }
  }
};

const updateSpotRate = (
  state: State,
  {
    currency,
    rate
  }: {
    currency: CurrencyCode;
    rate: number;
  }
) => {
  const now = +new Date();
  return {
    ...state,
    spot: {
      ...state.spot,
      bch: {
        ...state.spot.bch,
        [currency]: {
          rate,
          lastUpdated: now
        }
      }
    }
  };
};

const updateFiatCurrency = (state: State, currencyCode: CurrencyCode) => {
  return {
    ...state,
    currencySelected: currencyCode
  };
};

const prices = (state = initialState, action: Action) => {
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
