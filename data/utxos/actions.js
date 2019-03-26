// @flow

import { chunk } from "lodash";

import { utxosSelector } from "./selectors";
import { activeAccountIdSelector } from "../accounts/selectors";

import { type FullState } from "../store";

import {
  getAllUtxo,
  getTransactionDetails,
  decodeTxOut
} from "../../utils/transaction-utils";

// Rename to updateUTXO's?  more clear as the selectors compute balances from these

// Update the UTXO's for a given account.
// Contains logic to separate them by spendability and tokens
const updateBalances = address => {
  return async (dispatch: Function, getState: Function) => {
    const state: FullState = getState();
    const accountId = activeAccountIdSelector(state);

    // Get the existing UTXO's in store for account
    const utxosSlice = state.utxos;
    const accountUtxos = (utxosSlice.byAccount[accountId] || []).map(
      utxoId => utxosSlice.byId[utxoId]
    );

    // Get all UTXO for account
    const utxosAll = await getAllUtxo(address);

    // Remove spent and un-validated SLP txs
    const cachedUtxoFiltered = accountUtxos
      .filter(utxoCached =>
        utxosAll.some(
          utxoCurrent =>
            utxoCurrent.txid === utxoCached.txid &&
            utxoCurrent.vout === utxoCached.vout
        )
      )
      .filter(cachedUtxo => !(cachedUtxo.slp && !cachedUtxo.validSLP));

    // New utxos to get data for
    const utxosNew = utxosAll.filter(
      utxoCurrent =>
        !cachedUtxoFiltered.some(
          utxoCached =>
            utxoCurrent.txid === utxoCached.txid &&
            utxoCurrent.vout === utxoCached.vout
        )
    );

    // Update UTXOS with tx details before saving
    const newTxIds = utxosNew.map(utxo => utxo.txid);
    const txDetailChunks = await Promise.all(
      chunk(newTxIds, 20).map(txIds => getTransactionDetails(txIds))
    );
    const txDetails = [].concat(...txDetailChunks);
    const utxosNewWithTxDetails = utxosNew.map((utxo, idx) => ({
      ...utxo,
      tx: txDetails[idx]
    }));

    // Decode SLP and set as spendable or not
    const utxosSlpOrSpendable = utxosNewWithTxDetails.map(utxo => {
      try {
        const slpDecoded = decodeTxOut(utxo);
        return { ...utxo, slp: slpDecoded, spendable: false };
      } catch (e) {
        return { ...utxo, spendable: true };
      }
    });

    const slpTxidsToValidate = [
      ...new Set(
        utxosSlpOrSpendable
          .filter(utxo => utxo.slp !== undefined)
          .map(utxo => utxo.txid)
      )
    ];

    let utxosToAdd = null;
    try {
      const validSLPTx = await Promise.all(
        chunk(slpTxidsToValidate, 20).map(async txIdsToValidate => {
          const response = await fetch(
            "https://rest.bitcoin.com/v2/slp/validateTxid",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              data: {
                txids: txIdsToValidate
              }
            }
          );
          const validSLPTxChunk = response.data
            .filter(chunkResult => chunkResult.valid === true)
            .map(chunkResult => chunkResult.txid);
          return validSLPTxChunk;
        })
      );
      const validSlpTxs = [].concat(...validSLPTx);

      const utxosValidSlpTx = utxosSlpOrSpendable.map(utxo =>
        validSlpTxs.includes(utxo.txid) ? { ...utxo, validSlpTx: true } : utxo
      );
      utxosToAdd = utxosValidSlpTx;
    } catch (validateSLPTxException) {
      // Validation incomplete. Ignore all uncached SLP UTXOs
      const nonSLPUtxos = utxosSlpOrSpendable.filter(
        utxo => utxo.slp === undefined
      );
      utxosToAdd = nonSLPUtxos;
    }

    const utxoUpdatedFull = [...cachedUtxoFiltered, ...utxosToAdd];

    console.log("full?");
    console.log(utxoUpdatedFull);

    // Remove spent UTXO
    // remove SLP unvalidated UTXO

    // Filter to just the uncached ones
    // Fetch the details for them
    // get the details of tx
    // Get Ids of all SLP tokens and set SLP object in utxo
    // try
    // Validate SLP DAG and set validSlpTx to true/false
    // Update utxoCache set?
    // Catch
    // remove all  SLP UTXOs
    // update utxoCache set

    // Trigger Actions to update token metadata?

    // BALANCE CALCULATIONS CAN BE DONE IN SELECTORS FROM HERE
  };
};

// const updateTransactions = (address: string) => {
//   return async (dispatch: Function, getState: Function) => {
//     console.log("1 - ENTERING GET TRANSACTION");
//     dispatch(getTransactionsStart());
//     //  TODO - Error or fail state
//     const transactions = await getHistoricalBchTransactions(address);
//     console.log("2 - GOT TRANSACTIONS?");
//     console.log(transactions);

//     dispatch(getTransactionsSuccess(transactions));
//   };
// };

export { updateBalances };
