import { AnyAction } from "redux";
import thunk, { ThunkDispatch } from "redux-thunk";
import configureMockStore from "redux-mock-store";

import * as actions from "./actions";
import * as actionTypes from "./constants";
import { FullState } from "../store";
import { Account } from "./reducer";

type DispatchExts = ThunkDispatch<FullState, void, AnyAction>;

const middlewares = [thunk];
const mockStore = configureMockStore<FullState, DispatchExts>(middlewares);

describe("accounts::action::creators", () => {
  it("should create action for - Get account start", () => {
    const expectedAction = {
      type: actionTypes.GET_ACCOUNT_START,
      payload: null
    };
    expect(actions.getAccountStart()).toEqual(expectedAction);
  });

  it("should create action for - Get account success", () => {
    // Only testing these values get passed, not the logic on them at this point.
    const account = ("anything" as unknown) as Account;
    const accountSlp = ("anything2" as unknown) as Account;
    const isNew = true;
    const expectedAction = {
      type: actionTypes.GET_ACCOUNT_SUCCESS,
      payload: { account, accountSlp, isNew }
    };
    expect(actions.getAccountSuccess(account, accountSlp, isNew)).toEqual(
      expectedAction
    );
  });

  it("should create action for - Get account fail", () => {
    const expectedAction = {
      type: actionTypes.GET_ACCOUNT_FAIL,
      payload: null
    };
    expect(actions.getAccountFail()).toEqual(expectedAction);
  });

  it("should create action for - logout account", () => {
    const expectedAction = {
      type: actionTypes.LOGOUT_ACCOUNT,
      payload: null
    };
    expect(actions.logoutAccount()).toEqual(expectedAction);
  });

  it("should create action for - view seed", () => {
    const address = "someString";
    const expectedAction = {
      type: actionTypes.VIEW_SEED,
      payload: { address }
    };
    expect(actions.viewSeed(address)).toEqual(expectedAction);
  });
});

describe("accounts::actions::async", () => {
  it.todo("get account flow");
});
