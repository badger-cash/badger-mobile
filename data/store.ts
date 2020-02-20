import {
  createStore,
  combineReducers,
  applyMiddleware,
  Middleware,
  AnyAction
} from "redux";
import { persistStore, persistReducer, PersistState } from "redux-persist";
import AsyncStorage from "@react-native-community/async-storage";
import ReduxThunk, { ThunkMiddleware } from "redux-thunk";

import accountsReducer, {
  State as StateAccount,
  initialState as initialAccountState
} from "./accounts/reducer";

import transactionsReducer, {
  State as StateTransactions,
  initialState as initialTransactionsState
} from "./transactions/reducer";

import utxosReducer, {
  State as StateUTXOS,
  initialState as initialUTXOSState
} from "./utxos/reducer";

import tokensReducer, {
  State as StateTokens,
  initialState as initialTokensState
} from "./tokens/reducer";

import pricesReducer, {
  State as StatePrices,
  initialState as initialPricesState
} from "./prices/reducer";

export type FullState = {
  accounts: StateAccount;
  prices: StatePrices;
  tokens: StateTokens;
  transactions: StateTransactions;
  utxos: StateUTXOS;
  _persist?: PersistState;
};

const initialState: FullState = {
  accounts: initialAccountState,
  prices: initialPricesState,
  tokens: initialTokensState,
  transactions: initialTransactionsState,
  utxos: initialUTXOSState
};

// TODO - Setup encryption on certain parts of the redux state
const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["utxos", "tokens", "transactions"]
};

// keypairs are re-computed each time the app launches, cannot persist complex objects easily.
const accountsPersistConfig = {
  key: "accounts",
  storage: AsyncStorage,
  blacklist: ["keypairsByAccount"]
};

const pricesPersistConfig = {
  key: "prices",
  storage: AsyncStorage,
  whitelist: ["currencySelected"]
};

const rootReducer = combineReducers({
  accounts: persistReducer(accountsPersistConfig, accountsReducer),
  prices: persistReducer(pricesPersistConfig, pricesReducer),
  tokens: tokensReducer,
  transactions: transactionsReducer,
  utxos: utxosReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const Logger: Middleware = store => next => action => {
  if (__DEV__) {
    // Uncomment to enable debug logging
    // console.log("::LOG_ACTION::", action);
  }

  return next(action);
};

const middleware = [
  Logger,
  ReduxThunk as ThunkMiddleware<FullState, AnyAction>
];

const getStore = () => {
  // The ignore here is because it wants initialState to have all of the persist information.
  // Try removing after updating libraries
  const store = createStore(
    persistedReducer,
    // @ts-ignore
    initialState,
    applyMiddleware(...middleware)
  );
  const persistor = persistStore(store);
  return {
    store,
    persistor
  };
};

export { getStore };
