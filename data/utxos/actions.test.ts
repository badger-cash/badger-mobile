import configureMockStore from "redux-mock-store";
import thunk from "redux-thunk";
import fetchMock from "fetch-mock";

import * as actions from "./actions";
import * as actionTypes from "./constants";
import { UTXO } from "./reducer";

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

describe("utxos::actions::creators", () => {
  it("should create action for - UPDATE_UTXO_SUCCESS", () => {
    const address = "testAddress";
    const utxos = [] as UTXO[];

    const expectedAction = {
      type: actionTypes.UPDATE_UTXO_SUCCESS,
      payload: {
        utxos,
        address
      }
    };
    expect(actions.updateUtxoSuccess(utxos, address)).toEqual(expectedAction);
  });

  it("should create action for - UPDATE_UTXO_FAIL", () => {
    const expectedAction = {
      type: actionTypes.UPDATE_UTXO_FAIL,
      payload: null
    };
    expect(actions.updateUtxoFail()).toEqual(expectedAction);
  });
});

describe("utxos::actions::async", () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it.todo("creates UPDATE_UTXO_SUCCESS when fetching UTXOS completes");
  //, () => {

  // TODO
  // fetchMock.getOnce("/todos", {
  //   body: { todos: ["do something"] },
  //   headers: { "content-type": "application/json" }
  // });
  // const expectedActions = [
  //   { type: actionTypes.UPDATE_UTXO_START },
  //   {
  //     type: actionTypes.UPDATE_UTXO_SUCCESS,
  //     body: { todos: ["do something"] }
  //   }
  // ];
  // return store
  //   .dispatch(
  //     actions.updateUtxos(
  //       "bitcoincash:fakeaddress",
  //       "simpleledger:fakeaddress"
  //     )
  //   )
  //   .then(() => {
  //     // return of async actions
  //     expect(store.getActions()).toEqual(expectedActions);
  //   });
  // });
});
