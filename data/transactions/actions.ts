import BigNumber from "bignumber.js";

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import {
  getHistoricalBchTransactions,
  getHistoricalSlpTransactions,
  ResultBitDB,
  ResultSlpDB
} from "../../utils/balance-utils";

import { SLP } from "../../utils/slp-sdk-utils";

import { Transaction } from "./reducer";
import { transactionsLatestBlockSelector } from "../selectors";
import { transactionsSelector } from "./selectors";

const appendBCHPrefix = (target: string) => `bitcoincash:${target}`;

const getTransactionsStart = () => ({
  type: GET_TRANSACTIONS_START,
  payload: null
});

const getTransactionsSuccess = (transactions: any[], address: string) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: {
    transactions,
    address
  }
});

const getTransactionsFail = () => ({
  type: GET_TRANSACTIONS_FAIL,
  payload: null
});

const updateTransactions = (address: string, addressSlp: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!address || !addressSlp) return;

    const currentState = getState();
    const isUpdating = currentState.transactions.updating;
    const lastUpdate = currentState.transactions.lastUpdate || 0;

    const now = +new Date();

    // Short circuit if already processing, and it's been under 7 minutes
    if (isUpdating && now - lastUpdate < 1000 * 60 * 7) {
      return;
    }

    dispatch(getTransactionsStart());

    const latestBlock = transactionsLatestBlockSelector(currentState);
    const allTxIds = new Set(transactionsSelector(currentState).allIds);

    const transactionsBCH = getHistoricalBchTransactions(
      address,
      addressSlp,
      latestBlock
    );

    const transactionsSlp = getHistoricalSlpTransactions(
      address,
      addressSlp,
      latestBlock
    );

    const [bchHistory, slpHistory] = await Promise.all<
      ResultBitDB[],
      ResultSlpDB[]
    >([transactionsBCH, transactionsSlp]);

    const formattedTransactionsBCH: Transaction[] = [];

    for (let tx of bchHistory) {
      const block = tx.blk && tx.blk.i ? tx.blk.i : 0;
      const hash = tx.tx.h;

      // Unconfirmed and already parsed, skip
      if (block === 0 && allTxIds.has(hash)) {
        continue;
      }

      // All input addresses in CashAddress format
      const fromAddressesAll = tx.in
        .map(input => input?.e?.a && appendBCHPrefix(input.e.a))
        .filter(Boolean);

      const fromAddresses = [...new Set(fromAddressesAll)];

      // If one input address, use that
      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;

      // Otherwise check if our wallet has input, prefer 145 over 245 wallet
      if (!fromAddress) {
        if (fromAddresses.includes(address)) {
          fromAddress = address;
        } else if (fromAddresses.includes(addressSlp)) {
          fromAddress = addressSlp;
        }
      }

      // All transaction output addresse, in CashAddr format
      const toAddressesAll = tx.out
        .map(output => output?.e?.a && appendBCHPrefix(output.e.a))
        .filter(Boolean);

      const toAddresses = [...new Set(toAddressesAll)];

      // Detect if it's from the users
      const fromUser =
        fromAddresses.includes(address) || fromAddresses.includes(addressSlp);

      // If one to address, use that.
      let toAddress = toAddresses.length === 1 ? toAddresses[0] : null;

      // if from us, search for an external to address
      if (fromUser) {
        toAddress = toAddresses.reduce<string | null>((acc, curr) => {
          if (acc) return acc;
          return [address, addressSlp].includes(curr) ? null : curr;
        }, null);
      }

      if (!toAddress) {
        // else search for one of our addresses
        toAddress = toAddresses.includes(address)
          ? address
          : toAddresses.includes(addressSlp)
          ? addressSlp
          : null;
      }

      // Relevant addresses for calculating the transaction value
      const valueAddresses = toAddresses.filter(target => {
        return fromUser
          ? ![address, addressSlp].includes(target)
          : [address, addressSlp].includes(target);
      });

      let value = 0;

      // Determine BCH value
      if (toAddress && fromAddress !== toAddress) {
        value = tx.out.reduce((accumulator, currentTx) => {
          if (
            currentTx.e &&
            currentTx.e.v &&
            valueAddresses.includes(appendBCHPrefix(currentTx.e.a))
          ) {
            accumulator += currentTx.e.v;
          }

          return accumulator;
        }, 0);
      }

      const formattedTx: Transaction = {
        hash,
        txParams: {
          from: fromAddress,
          to: toAddress,
          fromAddresses,
          toAddresses,
          valueBch: value
        },
        time: tx?.blk?.t ? tx.blk.t * 1000 : new Date().getTime(),
        block,
        networkId: "mainnet"
      };

      formattedTx && formattedTransactionsBCH.push(formattedTx);
    }

    const formattedTransactionsSLP: Transaction[] = [];

    const addressSimpleledger = await SLP.Address.toSLPAddress(address);
    const addressSlpSimpleledger = await SLP.Address.toSLPAddress(addressSlp);

    for (let tx of slpHistory) {
      const block = tx?.blk?.i || 0;
      const hash = tx.tx.h;

      // Unconfirmed and already parsed, skip
      if (block === 0 && allTxIds.has(hash)) {
        continue;
      }

      const { slp } = tx;

      const inputs = tx.in;
      const { outputs, tokenIdHex, transactionType, decimals } = slp.detail;

      // All from addresses in simpleledger format
      const fromAddresses = inputs.map(input => input?.e?.a).filter(Boolean);

      // All to addresses
      const toAddressesSLP = outputs
        .map(output => output?.address)
        .filter(Boolean);

      const toAddressesBCH = tx.out
        .map(output => output?.e?.a && output.e.a)
        .filter(Boolean);
      const toAddresses = [...new Set([...toAddressesSLP, ...toAddressesBCH])];

      // Detect if it's from this wallet
      let fromUser = fromAddresses.reduce((acc, curr) => {
        if (acc) return acc;
        return [addressSimpleledger, addressSlpSimpleledger].includes(curr);
      }, false);

      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;

      if (!fromAddress) {
        // If sending SLP, show from SLP address over the BCH address
        if (fromAddresses.includes(addressSlpSimpleledger)) {
          fromAddress = addressSlp;
        } else if (fromAddresses.includes(addressSimpleledger)) {
          fromAddress = address;
        }
      }

      let toAddress: string | null = null;

      // if from us, search for an external address
      if (fromUser) {
        toAddress = toAddresses.reduce<string | null>((acc, curr) => {
          if (acc) return acc;
          return [
            address,
            addressSlp,
            addressSimpleledger,
            addressSlpSimpleledger
          ].includes(curr)
            ? null
            : curr;
        }, null);
      } else {
        // else search for one of our addresses
        toAddress = toAddresses.includes(addressSlpSimpleledger)
          ? addressSlpSimpleledger
          : toAddresses.includes(addressSimpleledger)
          ? addressSimpleledger
          : null;
      }

      let interWallet = false;
      if (fromUser && !toAddress) {
        // Else from and to us?
        // False so these appear as received in wallet
        fromUser = false;
        interWallet = true;
        toAddress = toAddresses.includes(addressSlpSimpleledger)
          ? addressSlpSimpleledger
          : toAddresses.includes(addressSimpleledger)
          ? addressSimpleledger
          : null;
      }

      let value = new BigNumber(0);

      // Determine SLP value
      if (toAddress && fromAddress !== toAddress) {
        value = outputs.reduce((accumulator, currentValue) => {
          if (currentValue.address && currentValue.amount) {
            if (currentValue.address === toAddress) {
              accumulator = accumulator.plus(
                new BigNumber(currentValue.amount)
              );
            }
          }

          return accumulator;
        }, new BigNumber(0));
      }

      const valueAddresses =
        fromUser || interWallet
          ? toAddresses.filter(
              target =>
                ![addressSimpleledger, addressSlpSimpleledger].includes(target)
            )
          : toAddresses.filter(target =>
              [addressSimpleledger, addressSlpSimpleledger].includes(target)
            );

      let bchValue = 0;

      if (toAddress && fromAddress !== toAddress) {
        // Determine BCH value
        bchValue = tx.out.reduce((accumulator, currentTx) => {
          if (
            currentTx?.e?.v &&
            valueAddresses.includes(currentTx.e.a) &&
            currentTx.e.v !== 546
          ) {
            accumulator += currentTx.e.v;
          }

          return accumulator;
        }, 0);
      }

      const formattedTx: Transaction = {
        hash,
        txParams: {
          from: fromAddress,
          to: toAddress,
          fromAddresses,
          toAddresses,
          valueBch: bchValue,
          transactionType,
          sendTokenData: {
            tokenProtocol: "slp",
            tokenId: tokenIdHex,
            valueToken: value.toFixed(decimals)
          }
        },
        time: tx.blk && tx.blk.t ? tx.blk.t * 1000 : new Date().getTime(),
        block,
        networkId: "mainnet"
      };

      formattedTx && formattedTransactionsSLP.push(formattedTx);

      // Allow the UI to render after each item computes.
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const formattedTransactionsNew = [
      ...formattedTransactionsBCH,
      ...formattedTransactionsSLP
    ];

    dispatch(getTransactionsSuccess(formattedTransactionsNew, address));
  };
};

export { updateTransactions };
