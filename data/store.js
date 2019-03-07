// @flow

import { createStore, combineReducers, applyMiddleware } from "redux";

// import { createNavigationReducer } from "react-navigation";

// import { AsyncStorage } from 'react-native'
import thunk from "redux-thunk";

import accounts, {
  type State as StateAccount,
  initialState as initialAccountState
} from "./accounts/reducer";

import meta, {
  type State as StateMeta,
  initialState as initialMetaState
} from "./meta/reducer";

// import RootStack from "../navigation/AppNavigator";

export type FullState = {
  accounts: StateAccount,
  meta: StateMeta
};

const initialState: FullState = {
  accounts: initialAccountState,
  meta: initialMetaState
};

// const nav = createNavigationReducer(RootStack);

const rootReducer = combineReducers({
  // nav,
  accounts,
  meta
});

// const persistConfig = {
//   timeout: 0, // The code base checks for falsy, so 0 disables
//   key: "root",
//   storage,
//   whitelist: ["meta", "accounts"]
// };

// const persistedReducer = persistReducer(persistConfig, rootReducer);

const logger = ({ getState }) => {
  return next => action => {
    if (process.env.NODE_ENV === "development") {
      console.log("::LOG_ACTION::", action);
      // if (action.type === TRACKING_TRACK) {
      //   // console.log(`DISPATCH :: ${action.type}::${action.payload}`);
      // } else {
      //   // console.log(`DISPATCH :: ${action.type}`);
      // }
    }
    return next(action);
  };
};

// const navMiddleware = createReactNavigationReduxMiddleware(
//   "root",
//   state => state.nav
// );

const middleware = [thunk, logger];

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(...middleware)
);

// const persistor = persistStore(store, null, () => {
//   i18n.changeLanguage(store.getState().meta.locale);
// });

// export { persistor };
export { store };
