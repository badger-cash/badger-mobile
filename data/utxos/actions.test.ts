import * as actions from "./actions";
import * as actionTypes from "./constants";
import { UTXO } from "./reducer";

describe("UTXO::actions", () => {
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
});
