import {
  utxosSelector,
  utxosByAccountSelector,
  doneInitialLoadSelector,
  isUpdatingUTXO
} from "./selectors";
import { FullState } from "../store";

describe("utxos::selectors", () => {
  it("select full utxo state slice", () => {
    const utxosSlice = { arbitrary: "values" };

    const state = ({ utxos: utxosSlice } as unknown) as FullState;

    const result = utxosSelector(state);

    expect(result).toEqual(utxosSlice);
  });

  it("select all utxo for a single account", () => {
    const utxosSlice = {
      byId: {
        utxoId1: "utxoData1",
        utxoId2: "utxoData2",
        utxoId3: "utxoData3"
      },
      byAccount: { account1: ["utxoId1", "utxoId3"] }
    };
    const state = ({ utxos: utxosSlice } as unknown) as FullState;
    const result = utxosByAccountSelector(state, "account1");

    expect(result).toEqual(["utxoData1", "utxoData3"]);
  });

  it("isUpdatingUtxoSelector", () => {
    const utxosSlice = { updating: false };
    const state = ({ utxos: utxosSlice } as unknown) as FullState;
    const result = isUpdatingUTXO(state);

    expect(result).toEqual(false);
  });
});
