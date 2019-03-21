// @flow

import { createStore, combineReducers, applyMiddleware } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// import { createNavigationReducer } from "react-navigation";

// import { AsyncStorage } from 'react-native'
import ReduxThunk from "redux-thunk";

import accountsReducer, {
  type State as StateAccount,
  initialState as initialAccountState
} from "./accounts/reducer";

// import meta, {
//   type State as StateMeta,
//   initialState as initialMetaState
// } from "./meta/reducer";

export type FullState = {
  accounts: StateAccount
  // meta: StateMeta
};

// const initialState: FullState = {
//   accounts: initialAccountState,
//   meta: initialMetaState
// };

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["accounts"]
};

const rootReducer = combineReducers({
  accounts: accountsReducer
  // nav,
  // accounts,
  // meta
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

const initialState: FullState = { accounts: initialAccountState };

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
