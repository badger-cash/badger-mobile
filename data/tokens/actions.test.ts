import configureMockStore from "redux-mock-store";
import thunk, { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";

import {
  updateTokensMetaStart,
  updateTokensMetaFail,
  updateTokensMetaSuccess,
  updateTokensMeta
} from "./actions";
import * as actionTypes from "./constants";
import { initialState, TokenData } from "./reducer";
import { FullState } from "../store";

type DispatchExts = ThunkDispatch<FullState, void, AnyAction>;

const middlewares = [thunk];
const mockStore = configureMockStore<FullState, DispatchExts>(middlewares);

describe("tokens::action:creators", () => {
  it("should create action for - update token metadata start", () => {
    const expectedAction = {
      type: actionTypes.UPDATE_TOKENS_META_START,
      payload: null
    };
    expect(updateTokensMetaStart()).toEqual(expectedAction);
  });

  it("should create action for - update token metadata fail", () => {
    const expectedAction = {
      type: actionTypes.UPDATE_TOKENS_META_FAIL,
      payload: null
    };
    expect(updateTokensMetaFail()).toEqual(expectedAction);
  });

  it("should create action for - update token metadata success", () => {
    const tokenPlaceholder = [
      { tokenId: "tokenId1" },
      { tokenId: "tokenId2" },
      null
    ] as (TokenData | null)[];
    const expectedAction = {
      type: actionTypes.UPDATE_TOKENS_META_SUCCESS,
      payload: { tokens: tokenPlaceholder }
    };
    expect(updateTokensMetaSuccess(tokenPlaceholder)).toEqual(expectedAction);
  });
});

describe("tokens::action:async", () => {
  describe("update token metadata", () => {
    it("fetches LEAD metadata", async () => {
      const tokenIds = [
        "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006"
      ];
      const expectedActions = [
        {
          type: actionTypes.UPDATE_TOKENS_META_START,
          payload: null
        },
        {
          type: actionTypes.UPDATE_TOKENS_META_SUCCESS,
          payload: {
            tokens: [
              {
                tokenId:
                  "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
                symbol: "LEAD",
                name:
                  "LEAD Token (Leaders of Education Adoption and Development)",
                decimals: 2,
                protocol: "slp"
              }
            ]
          }
        }
      ];

      const store = mockStore({ tokens: initialState } as FullState);
      await store.dispatch(updateTokensMeta(tokenIds));

      const resultActions = store.getActions();

      expect(resultActions.length).toEqual(2);
      expect(resultActions[0].type).toEqual(expectedActions[0].type);
      expect(resultActions[1].type).toEqual(expectedActions[1].type);
      expect(resultActions).toEqual(expectedActions);
    });

    it("fetches multiple tokens metadata.  LEAD & zBCH", async () => {
      const tokenIds = [
        "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
        "f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec"
      ];
      const expectedActions = [
        {
          type: actionTypes.UPDATE_TOKENS_META_START,
          payload: null
        },
        {
          type: actionTypes.UPDATE_TOKENS_META_SUCCESS,
          payload: {
            tokens: [
              {
                tokenId:
                  "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006",
                symbol: "LEAD",
                name:
                  "LEAD Token (Leaders of Education Adoption and Development)",
                decimals: 2,
                protocol: "slp"
              },
              {
                tokenId:
                  "f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec",
                symbol: "zBCH",
                name: "Zurich BCH Meetup Token",
                decimals: 8,
                protocol: "slp"
              }
            ]
          }
        }
      ];

      const store = mockStore({ tokens: initialState } as FullState);
      await store.dispatch(updateTokensMeta(tokenIds));

      const resultActions = store.getActions();

      expect(resultActions.length).toEqual(2);
      expect(resultActions[0].type).toEqual(expectedActions[0].type);
      expect(resultActions[1].type).toEqual(expectedActions[1].type);
      expect(resultActions).toEqual(expectedActions);
    });
  });
});
