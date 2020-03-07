import utxosReducer, { initialState, UTXO } from "./reducer";
import { updateUtxoStart, updateUtxoFail, updateUtxoSuccess } from "./actions";
import { logoutAccount } from "../accounts/actions";

describe("utxos::reducer", () => {
  it("should return the initial state", () => {
    expect(utxosReducer(undefined, { type: "__init", payload: null })).toEqual(
      initialState
    );
  });

  it("handle utxo update start", () => {
    const stateBefore = { ...initialState };
    const stateAfter = utxosReducer(stateBefore, updateUtxoStart());

    const expectedState = { ...initialState, updating: true };
    expect(stateAfter).toEqual(expectedState);
  });

  it("handle utxo update fail basic", () => {
    const stateBefore = { ...initialState, updating: true };
    const stateAfter = utxosReducer(stateBefore, updateUtxoFail());

    const expectedState = { ...initialState, updating: false };
    expect(stateAfter).toEqual(expectedState);
  });

  describe("handle utxo update success", () => {
    it("adds new utxo to the store, normalized", () => {
      const stateBefore = { ...initialState };

      const utxo = ({
        _id: "someUtxoHash"
      } as unknown) as UTXO;

      const newUTXOs = [utxo];
      const address = "bchAddress";
      const stateAfter = utxosReducer(
        stateBefore,
        updateUtxoSuccess(newUTXOs, address)
      );

      const expectedState = {
        ...initialState,
        allIds: ["someUtxoHash"],
        byId: {
          someUtxoHash: utxo
        },
        byAccount: {
          bchAddress: ["someUtxoHash"]
        },
        updating: false
      };

      expect(stateAfter).toEqual(expectedState);
    });
  });
  it("handle logout account by resetting UTXO state", () => {
    const utxo = ({
      _id: "someUtxoHash"
    } as unknown) as UTXO;

    const stateBefore = {
      ...initialState,
      allIds: ["someUtxoHash"],
      byId: {
        someUtxoHash: utxo
      },
      byAccount: {
        bchAddress: ["someUtxoHash"]
      },
      updating: false
    };

    const stateAfter = utxosReducer(stateBefore, logoutAccount());

    const expectedState = {
      ...initialState
    };

    expect(stateAfter).toEqual(expectedState);
  });
});
