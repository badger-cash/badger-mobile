import { AnyAction } from "redux";
import {
  REMOVE_TOKEN_FROM_FAVORITES,
  ADD_TOKEN_TO_FAVORITES,
  SET_CODE_LANG
} from "./constants";

export interface SettingsState {
  tokenFavorites: string[] | undefined;
  codeLang: string | undefined;
}
export const initialState: SettingsState = {
  tokenFavorites: [],
  codeLang: "en"
};

const addTokenToFavorites = (
  state: SettingsState,
  tokenId: string
): SettingsState => {
  const { tokenFavorites } = state;
  const updatedFavorites = tokenFavorites
    ? [...new Set([...tokenFavorites, tokenId])]
    : [tokenId];

  return {
    ...state,
    tokenFavorites: updatedFavorites
  };
};

const removeTokenFromFavorites = (
  state: SettingsState,
  tokenId: string
): SettingsState => {
  const { tokenFavorites } = state;
  const updatedFavorites = tokenFavorites
    ? tokenFavorites.filter(x => x !== tokenId)
    : [];

  return {
    ...state,
    tokenFavorites: updatedFavorites
  };
};

const setCodeLang = (state: SettingsState, codeLang: string): SettingsState => {
  return {
    ...state,
    codeLang: codeLang
  };
};

const settings = (state = initialState, action: AnyAction): SettingsState => {
  switch (action.type) {
    case ADD_TOKEN_TO_FAVORITES:
      return addTokenToFavorites(state, action.payload);

    case REMOVE_TOKEN_FROM_FAVORITES:
      return removeTokenFromFavorites(state, action.payload);

    case SET_CODE_LANG:
      return setCodeLang(state, action.payload);

    default:
      return state;
  }
};

export default settings;
