import {
  REMOVE_TOKEN_FROM_BLACKLIST,
  ADD_TOKEN_TO_BLACKLIST
} from "./constants";

const addTokenToBlackList = (tokenId: string) => ({
  type: ADD_TOKEN_TO_BLACKLIST,
  payload: tokenId
});

const removeTokenFromBlackList = (tokenId: string) => ({
  type: REMOVE_TOKEN_FROM_BLACKLIST,
  payload: tokenId
});

export { addTokenToBlackList, removeTokenFromBlackList };
