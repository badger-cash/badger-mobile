// @flow

import { createStore, combineReducers, applyMiddleware } from "redux";

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

const rootReducer = combineReducers({
  accounts: accountsReducer
  // nav,
  // accounts,
  // meta
});

// const persistConfig = {
//   timeout: 0, // The code base checks for falsy, so 0 disables
//   key: "root",
//   storage,
//   whitelist: [accounts"]
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

const Logger = ({ getState }) => {
  return next => action => {
    if (__DEV__) {
      console.log("::LOG_ACTION::", action);
    }
    return next(action);
  };
};

const initialState: FullState = { base: null, accounts: initialAccountState };

const middleware = [Logger, ReduxThunk];

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(...middleware)
);

export { store };
