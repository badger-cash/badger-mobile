import {
  REMOVE_TOKEN_FROM_FAVORITES,
  ADD_TOKEN_TO_FAVORITES
} from "./constants";

const addTokenToFavorites = (tokenId: string) => ({
  type: ADD_TOKEN_TO_FAVORITES,
  payload: tokenId
});

const removeTokenFromFavorites = (tokenId: string) => ({
  type: REMOVE_TOKEN_FROM_FAVORITES,
  payload: tokenId
});

export { addTokenToFavorites, removeTokenFromFavorites };
