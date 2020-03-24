import { chunk } from "lodash";

import {
  UPDATE_TOKENS_META_START,
  UPDATE_TOKENS_META_SUCCESS,
  UPDATE_TOKENS_META_FAIL
} from "./constants";

import { TokenData } from "./reducer";

import {
  getTransactionDetails,
  decodeTokenMetadata
} from "../../utils/transaction-utils";

const updateTokensMetaStart = () => ({
  type: UPDATE_TOKENS_META_START,
  payload: null
});

const updateTokensMetaSuccess = (tokens: (TokenData | null)[]) => ({
  type: UPDATE_TOKENS_META_SUCCESS,
  payload: {
    tokens
  }
});

const updateTokensMetaFail = () => ({
  type: UPDATE_TOKENS_META_FAIL,
  payload: null
});

const updateTokensMeta = (tokenIds: string[]) => {
  return async (dispatch: Function, getState: Function): Promise<void> => {
    dispatch(updateTokensMetaStart());

    const transactionRequests = await Promise.all(
      chunk(tokenIds, 20).map(tokenIdChunk =>
        getTransactionDetails(tokenIdChunk)
      )
    );

    // concat the chunked arrays
    const tokenTxDetailsList = [].concat(...transactionRequests);

    const tokenMetadataList = tokenTxDetailsList
      .map(txDetails => {
        try {
          return decodeTokenMetadata(txDetails);
        } catch (err) {
          console.warn("Could not parse SLP genesis:", err);
          return null;
        }
      })
      .filter(Boolean);

    dispatch(updateTokensMetaSuccess(tokenMetadataList));
  };
};

export {
  updateTokensMeta,
  updateTokensMetaStart,
  updateTokensMetaFail,
  updateTokensMetaSuccess
};
