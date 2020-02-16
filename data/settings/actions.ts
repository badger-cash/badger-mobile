import {
  REMOVE_TOKEN_FROM_BLACKLIST,
  ADD_TOKEN_TO_BLACKLIST
} from "./constants";

const addTokenToBlackList = (tokenID: string) => ({
  type: ADD_TOKEN_TO_BLACKLIST,
  payload: tokenID
});

const removeTokenFromBlackList = (tokenID: string) => ({
  type: REMOVE_TOKEN_FROM_BLACKLIST,
  payload: tokenID
});

export { addTokenToBlackList, removeTokenFromBlackList };
