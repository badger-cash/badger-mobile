// @flow

// Add an additional account from HD
export const ADD_ACCOUNT = "badger::accounts:ADD_ACCOUNT";

// Set keywords to derive everything
export const SET_KEYWORDS = "badger::account::SET_KEYWORDS";

// Get or create an account from keywords
export const GET_ACCOUNT_START = "badger:accounts:GET_ACCOUNT_START";
export const GET_ACCOUNT_SUCCESS = "badger:accounts:GET_ACCOUNT_SUCCESS";
export const GET_ACCOUNT_FAIL = "badger:accounts:GET_ACCOUNT_FAIL";

// Maybe move to a keychain reducer?
export const CREATE_NEW_KEYCHAIN_START =
  "badger::accounts::CREATE_NEW_KEYCHAIN_START";
export const CREATE_NEW_KEYCHAIN_SUCCESS =
  "badger::accounts::CREATE_NEW_KEYCHAIN_SUCCESS";
export const CREATE_NEW_KEYCHAIN_FAIL =
  "badger::accounts::CREATE_NEW_KEYCHAIN_FAIL";
