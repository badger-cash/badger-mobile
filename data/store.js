// @flow

import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import ReduxThunk from "redux-thunk";

import accountsReducer, {
  type State as StateAccount,
  initialState as initialAccountState
} from "./accounts/reducer";

import transactionsReducer, {
  type State as StateTransactions,
  initialState as initialTransactionsState
} from "./transactions/reducer";

import utxosReducer, {
  type State as StateUTXOS,
  initialState as initialUTXOSState
} from "./utxos/reducer";

import tokensReducer, {
  type State as StateTokens,
  initialState as initialTokensState
} from "./tokens/reducer";

export type FullState = {
  accounts: StateAccount,
  tokens: StateTokens,
  transactions: StateTransactions,
  utxos: StateUTXOS
};

const initialState: FullState = {
  accounts: initialAccountState,
  tokens: initialTokensState,
  transactions: initialTransactionsState,
  utxos: initialUTXOSState
};

// TODO - Setup encryption on certain parts of the redux state
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["utxos", "tokens"] // "transactions"
};

// keypairs are re-computed each time the app launches, cannot persist complex objects easily.
const accountsPersistConfig = {
  key: "accounts",
  storage: storage,
  blacklist: ["keypairsByAccount"]
};

const rootReducer = combineReducers({
  accounts: persistReducer(accountsPersistConfig, accountsReducer),
  transactions: transactionsReducer,
  utxos: utxosReducer,
  tokens: tokensReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const Logger = ({ getState }) => {
  return next => action => {
    if (__DEV__) {
      console.log("::LOG_ACTION::", action);
    }
    return next(action);
  };
};

const middleware = [Logger, ReduxThunk];

const getStore = () => {
  const store = createStore(
    persistedReducer,
    initialState,
    applyMiddleware(...middleware)
  );
  const persistor = persistStore(store);
  return { store, persistor };
};

export { getStore };
