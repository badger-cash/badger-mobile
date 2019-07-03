// @flow

import BigNumber from "bignumber.js";
import SLPSDK from "slp-sdk";

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import {
  getHistoricalBchTransactions,
  getHistoricalSlpTransactions
} from "../../utils/balance-utils";

import { transactionsLatestBlockSelector } from "../selectors";

const SLP = new SLPSDK();

const getTransactionsStart = () => ({
  type: GET_TRANSACTIONS_START,
  payload: null
});

const getTransactionsSuccess = (transactions: any[], address: string) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: { transactions, address }
});

const getTransactionsFail = () => ({
  type: GET_TRANSACTIONS_FAIL,
  payload: null
});

const updateTransactions = (address: string, addressSlp: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!address || !addressSlp) return;

    dispatch(getTransactionsStart());

    const currentState = getState();
    const latestBlock = transactionsLatestBlockSelector(currentState);

    const transactionsBCH145 = getHistoricalBchTransactions(
      address,
      latestBlock
    );

    const transactionsBCH245 = getHistoricalBchTransactions(
      addressSlp,
      latestBlock
    );

    const transactionsSlp = getHistoricalSlpTransactions(
      address,
      addressSlp,
      latestBlock
    );

    const [bch145History, bch245History, slpHistory] = await Promise.all([
      transactionsBCH145,
      transactionsBCH245,
      transactionsSlp
    ]);

    const transactionsBCH = [...bch145History, ...bch245History];

    const formattedTransactionsBCH = transactionsBCH.map(tx => {
      const fromAddresses = tx.in
        .filter(input => input.e && input.e.a)
        .map(input => `bitcoincash:${input.e.a}`)
        .reduce((acc, currentValue) => {
          if (!acc.find(element => element === currentValue)) {
            acc.push(currentValue);
          }
          return acc;
        }, []);
      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;
      if (!fromAddress && fromAddresses.includes(address)) {
        fromAddress = address;
      }

      const toAddresses = tx.out
        .filter(output => output.e && output.e.a)
        .map(output => `bitcoincash:${output.e.a}`)
        .reduce((accumulator, currentValue) => {
          if (!accumulator.find(element => element === currentValue)) {
            accumulator.push(currentValue);
          }
          return accumulator;
        }, []);
      let toAddress = toAddresses.length === 1 ? toAddresses[0] : null;
      if (
        !toAddress &&
        toAddresses.length === 2 &&
        toAddresses.find(element => element === fromAddress)
      ) {
        toAddress = toAddresses.filter(element => element !== fromAddress)[0];
      } else if (!toAddress && toAddresses.includes(address)) {
        toAddress = address;
      }

      // Determine value
      let value = 0;
      if (toAddress && fromAddress !== toAddress) {
        value = tx.out.reduce((accumulator, currentValue) => {
          if (
            currentValue.e &&
            `bitcoincash:${currentValue.e.a}` === toAddress &&
            currentValue.e.v
          ) {
            accumulator += currentValue.e.v;
          }
          return accumulator;
        }, 0);
      }

      return {
        hash: tx.tx.h,
        txParams: {
          from: fromAddress,
          to: toAddress,
          fromAddresses,
          toAddresses,
          value
        },
        time: tx.blk && tx.blk.t ? tx.blk.t * 1000 : new Date().getTime(),
        block: tx.blk && tx.blk.i ? tx.blk.i : 0,
        status: "confirmed",
        networkId: "mainnet" // Todo - Support testnet from settings
      };
    });

    const formattedTransactionsSLP = slpHistory.map(tx => {
      const { slp } = tx;
      const inputs = tx.in;

      const { outputs, tokenIdHex, transactionType, decimals } = slp.detail;

      // All from addresses in cashaddr format
      const fromAddresses = inputs
        .filter(input => input.e && input.e.a)
        .map(input => {
          const addr = SLP.Address.toCashAddress(input.e.a);
          return addr;
        });

      // All to addresses in cashaddr format
      const toAddresses = outputs
        .filter(output => output.address)
        .map(output => {
          const addr = SLP.Address.toCashAddress(output.address);
          return addr;
        });

      // Detect if it's from this wallet
      let fromUser = fromAddresses.reduce((acc, curr) => {
        if (acc) return acc;
        return [address, addressSlp].includes(curr);
      }, false);

      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;

      // If sending SLP, show from SLP address over the BCH address
      if (!fromAddress && fromAddresses.includes(addressSlp)) {
        fromAddress = addressSlp;
      } else if (!fromAddress && fromAddresses.includes(address)) {
        fromAddress = address;
      }

      let toAddress = null;

      // if from us, search for an external address
      if (fromUser) {
        toAddress = toAddresses.reduce((acc, curr) => {
          if (acc) return acc;
          return [address, addressSlp].includes(curr) ? null : curr;
        }, null);
      } else {
        // else search for one of our addresses
        toAddress = toAddresses.includes(addressSlp)
          ? addressSlp
          : toAddresses.includes(address) && address;
      }

      // Else from and to us?
      if (fromUser && !toAddress) {
        // Change to false so these appear as received
        fromUser = false;
        toAddress = toAddresses.includes(addressSlp)
          ? addressSlp
          : toAddresses.includes(address) && address;
      }

      // Determine value
      let value = new BigNumber(0);
      if (toAddress && fromAddress !== toAddress) {
        value = outputs.reduce((accumulator, currentValue) => {
          if (currentValue.address && currentValue.amount) {
            const outputAddress = SLP.Address.toCashAddress(
              currentValue.address
            );
            if (outputAddress === toAddress) {
              accumulator = accumulator.plus(
                new BigNumber(currentValue.amount)
              );
            }
          }
          return accumulator;
        }, new BigNumber(0));
      }

      return {
        hash: tx.tx.h,
        txParams: {
          from: fromAddress,
          to: toAddress,
          fromAddresses,
          toAddresses,
          value: value.toFixed(decimals),
          transactionType,
          sendTokenData: {
            tokenProtocol: "slp",
            tokenId: tokenIdHex
          }
        },
        time: tx.blk && tx.blk.t ? tx.blk.t * 1000 : new Date().getTime(),
        block: tx.blk && tx.blk.i ? tx.blk.i : 0,
        status: "confirmed",
        network: "mainnet"
      };
    });

    const formattedTransactionsNew = [
      ...formattedTransactionsBCH,
      ...formattedTransactionsSLP
    ];

    dispatch(getTransactionsSuccess(formattedTransactionsNew, address));
  };
};

export { updateTransactions };
