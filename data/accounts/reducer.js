// @flow

import {
  // ADD_ACCOUNT,
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL,
  LOGOUT_ACCOUNT
} from "./constants";

export type Account = {
  address: string,
  keypair: ECPair,
  mnemonic: string
};
// export type Account = {
//   name: string,
//   address: string,
//   balance: string,
//   utxoCache: UTXO[],
//   tokenCache: boolean, // This can/should go in the `tokens` reducer
//   historicalTransactions: HistoricalTransaction[],

//   // These should live with the keyring?
//   seedwords: string[], // SHOULD BE ENCRYPTED? MAYBE? MAYBE NOT?
//   privateKey: string // SAME FOR THIS.  ENCRYPTED WITHIN APP?
// };

type ScriptSig = {
  hex: string,
  asm: string,
  addresses: string[]
};

type ScriptPubKey = {
  hex: string,
  asm: string,
  addresses: string[],
  type: string
};

type Vin = {
  txid: string, //"16924b22927cfa1de4345c1d331ce43ac13cb8fbe1eeaeb3c7c65e01e7766e63",
  vout: number, //3,
  sequence: number, //4294967295,
  n: number, // 0,
  scriptSig: ScriptSig,
  value: number, //400120,
  legacyAddress: string, //"13o2C4C91fHD8tAi8PUL9NJTnqL3XtJMwe",
  cashAddress: string //"bitcoincash:qq02gcfjwwzvl6mmqtth8j87kt4f9xrqdy2m3ed7pe"
};

type Vout = {
  value: string, //"0.00000546",  // Why is this a string here, but number in Vin?  consolidate?
  n: number, //2,
  scriptPubKey: ScriptPubKey,
  spentTxId: string, //"cc51a85d7d4fe48926e9a5e2719c8ddb8f4c4ae616ca44a4c880f00522891898",
  spentIndex: number, //1,
  spentHeight: number //572476
};

type UTXO = {
  txid: string,
  vout: number,
  amount: number, //0.00000546,  //This is same as satoshis, need both?
  satoshis: number, //546,
  height: number, // 572475,
  confirmations: number, //32,
  tx: {
    txid: string, // same as higher level txid?
    version: number,
    locktime: number,
    vin: Vin[],
    vout: Vout[],
    blockhash: string,
    blockheight: number,
    confirmations: number,
    time: number,
    blocktime: number, //1551805687, // is this always same as time?
    valueOut: number, //0.0040015,
    size: number, //480,
    valueIn: number, //0.00400666,
    fees: number //0.00000516
  },
  slp: {
    token: string, //"1b2e389ed62a612f74f4520ef3a0de0a6d4cd40725f396635f89df96bc77b0a5",
    quantity: string, //"60000000000000",  why string
    baton: boolean //false
  },
  spendable: boolean, //false,
  validSlpTx: boolean //true
};

type HistoricalTransaction = {
  hash: string, //"0250dfd941fe6c50f9bdacb3457d57ddbf083080acae4ac6c3532fe8540dc679",
  txParams: {
    from: string, //"bitcoincash:qq6qcjt6xlkeqzdwkhdvfyl2q2d2wafkggt6uedq8u",
    to: string, //bitcoincash:qqqyfkjwa50nx2gzuy7eegh9yd0nd9p5ggrf3n0fwg",
    value: string //"1000"
  },
  time: number, //1551556630,
  status: string, //"confirmed",
  metamaskNetworkId: "mainnet" | "testnet",
  loadingDefaults: boolean //false ?
};

// transaction store
// [account]

// transaction history
// sent / received

type Action = { type: string, payload: any };

export type State = {
  byId: { [accountId: string]: Account },
  allIds: string[],
  activeId: ?string
};

export const initialState: State = { byId: {}, allIds: [], activeId: null };

const addAccount = (state: State, payload: { account: Account }) => {
  const { account } = payload;

  // TODO - Look into keypairs, cannot persist without serialization as they are not POJO.  Figure out which parts are needed to persist.
  const { keypair, ...removedKeypair } = account;
  const { address } = removedKeypair;

  const existingAcounts = state.allIds;
  if (existingAcounts.includes(address)) {
    return state;
  }

  return {
    ...state,
    byId: { ...state.byId, [address]: removedKeypair },
    allIds: [...state.allIds, address],
    activeId: address
  };
};

const logoutAccount = (state: State) => {
  return initialState;
};

const accounts = (state: State = initialState, action: Action): State => {
  switch (action.type) {
    case GET_ACCOUNT_START:
      return state;
    case GET_ACCOUNT_SUCCESS:
      return addAccount(state, action.payload);
    case LOGOUT_ACCOUNT:
      return logoutAccount(state);
    default:
      return state;
  }
};

export default accounts;
