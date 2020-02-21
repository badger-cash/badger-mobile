import { AnyAction } from "redux";
import thunk, { ThunkDispatch } from "redux-thunk";
import configureMockStore from "redux-mock-store";
import fetchMock from "fetch-mock";

import * as actions from "./actions";
import * as actionTypes from "./constants";
import { FullState } from "../store";

type DispatchExts = ThunkDispatch<FullState, void, AnyAction>;

const middlewares = [thunk];
const mockStore = configureMockStore<FullState, DispatchExts>(middlewares);

describe("prices::actions", () => {
  describe("prices::action creators", () => {
    it("should create action for - Set fiat currency", () => {
      const currencyCode = "CHF";
      const expectedAction = {
        type: actionTypes.SET_FIAT_CURRENCY,
        payload: currencyCode
      };
      expect(actions.setFiatCurrency(currencyCode)).toEqual(expectedAction);
    });

    it("should create action for - Updating spot rate start", () => {
      const expectedAction = {
        type: actionTypes.UPDATE_BCH_SPOT_PRICE_START,
        payload: null
      };
      expect(actions.updateSpotPriceStart()).toEqual(expectedAction);
    });

    it("should create action for - Updating spot rate success", () => {
      const now = +new Date();

      const expectedAction = {
        type: actionTypes.UPDATE_BCH_SPOT_PRICE_SUCCESS,
        payload: { currency: "CHF", rate: 5000, timestamp: now }
      };

      expect(actions.updateSpotPriceSuccess("CHF", 5000, now)).toEqual(
        expectedAction
      );
    });

    it("should create action for - Updating spot rate fail", () => {
      const now = +new Date();
      const expectedAction = {
        type: actionTypes.UPDATE_BCH_SPOT_PRICE_FAIL,
        payload: { currency: "CHF", timestamp: now }
      };
      expect(actions.updateSpotPriceFail("CHF", now)).toEqual(expectedAction);
    });
  });

  describe("prices::actions async", () => {
    beforeEach(() => {
      // Todo - Proper mock the fetching, but price endpoint uses axios, not fetch.
      fetchMock.restore();
    });

    it("fetches and passes on the new price", async () => {
      fetchMock.getOnce(`https://index-api.bitcoin.com/api/v0/cash/price/chf`, {
        data: { price: 500000 }
      });
      const expectedActions = [
        { type: actionTypes.UPDATE_BCH_SPOT_PRICE_START },
        {
          type: actionTypes.UPDATE_BCH_SPOT_PRICE_SUCCESS,
          payload: { rate: 5000, currency: "CHF" }
        }
      ];
      const store = mockStore({ prices: { spot: {} } } as FullState);

      await store.dispatch(actions.updateSpotPrice("CHF"));

      const gotActions = store.getActions();

      expect(gotActions.length).toEqual(2);
      expect(gotActions[0].type).toEqual(expectedActions[0].type);
      expect(gotActions[1].type).toEqual(expectedActions[1].type);
    });
  });
});
