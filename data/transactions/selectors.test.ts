import {
  transactionsSelector,
  isUpdatingTransactionsSelector
} from "./selectors";
import { FullState } from "../store";

describe("transactions::selectors", () => {
  it("gets all transactions", () => {
    const transactionsData = { checking: "full slice" };
    const state = ({ transactions: transactionsData } as unknown) as FullState;
    const result = transactionsSelector(state);

    expect(result).toEqual(transactionsData);
  });

  it("gets the current update status", () => {
    const state = ({
      transactions: { updating: true }
    } as unknown) as FullState;

    const result = isUpdatingTransactionsSelector(state);

    expect(result).toEqual(true);

    const state2 = ({
      transactions: { updating: false }
    } as unknown) as FullState;
    const result2 = isUpdatingTransactionsSelector(state2);
    expect(result2).toEqual(false);
  });
});
