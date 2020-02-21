import {
  REMOVE_TOKEN_FROM_BLACKLIST,
  ADD_TOKEN_TO_BLACKLIST
} from "./constants";

type Action = {
  type: string;
  payload: any;
};

export interface SettingsState {
  tokenBlacklist: string[];
}
export const initialState: SettingsState = {
  tokenBlacklist: []
};

const addTokenToBlackList = (
  state: SettingsState,
  tokenId: string
): SettingsState => {
  const { tokenBlacklist } = state;
  const updatedBlacklist = [...new Set([...tokenBlacklist, tokenId])];

  return {
    ...state,
    tokenBlacklist: updatedBlacklist
  };
};

const removeTokenFromBlackList = (
  state: SettingsState,
  tokenId: string
): SettingsState => {
  const { tokenBlacklist } = state;
  const updatedBlacklist = tokenBlacklist.filter(x => x !== tokenId);

  return {
    ...state,
    tokenBlacklist: updatedBlacklist
  };
};

const settings = (state = initialState, action: Action): SettingsState => {
  switch (action.type) {
    case ADD_TOKEN_TO_BLACKLIST:
      return addTokenToBlackList(state, action.payload);

    case REMOVE_TOKEN_FROM_BLACKLIST:
      return removeTokenFromBlackList(state, action.payload);

    default:
      return state;
  }
};

export default settings;
