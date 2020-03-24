import { tokensByIdSelector } from "./selectors";
import { FullState } from "../store";

describe("tokens::selectors", () => {
  it("returns all token metadata indexed by tokenId", () => {
    const tokenData = { a: { tokenId: "a" }, b: { tokenId: "b" } };
    const state = ({ tokens: { byId: tokenData } } as unknown) as FullState;
    const result = tokensByIdSelector(state);

    expect(result["a"].tokenId).toEqual("a");
    expect(result["b"].tokenId).toEqual("b");
    expect(result).toEqual(tokenData);
  });
});
