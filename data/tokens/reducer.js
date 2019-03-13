// @flow

// Meta data about all token data

type TokenData = {
  address: string,
  symbol: string,
  decimals: number,
  string: string, // what is this?
  protocol: "slp" | "whc",
  protocolData: {
    baton: boolean
  }
};

type State = TokenData[];

const initialState: TokenData[] = [];

const tokenReducer = (state: State = initialState, action) => {
  return state;
};

export default tokenReducer;
