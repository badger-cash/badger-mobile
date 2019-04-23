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
    dispatch(getTransactionsStart());

    // Fetch all transactions
    // Need to check both as BCH and SLP can live on both 145 and 245 accounts

    // Determine most recently fetched tx block for account first.
    const latestBlock = 0;
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

    // const transactionsSLP = await getHistoricalSlpTransactions(address);
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
          fromAddresses: fromAddresses,
          toAddresses: toAddresses,
          value
        },
        time: tx.blk && tx.blk.t ? tx.blk.t * 1000 : new Date().getTime(),
        block: tx.blk && tx.blk.i ? tx.blk.i : 0,
        status: "confirmed",
        networkId: "mainnet" // Todo - Support testnet from settings
      };
    });

    const formattedTransactionsSLP = slpHistory.map(tx => {
      const fromAddresses = tx.in
        .filter(input => input.e && input.e.a)
        .map(input => {
          const addr = `bitcoincash:${input.e.a}`;
          if (addr === addressSlp) return address;
          else return addr;
        })
        .reduce((accumulator, currentValue) => {
          if (!accumulator.find(element => element === currentValue)) {
            accumulator.push(currentValue);
          }
          return accumulator;
        }, []);
      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;
      if (!fromAddress && fromAddresses.includes(address)) {
        fromAddress = address;
      }

      // Determine to address
      const toAddresses = tx.slp.detail.outputs
        .filter(output => output.address)
        .map(output => {
          const addr = SLP.Address.toCashAddress(output.address);
          if (addr === addressSlp) return address;
          else return addr;
        })
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
      let value = new BigNumber(0);
      if (toAddress && fromAddress !== toAddress) {
        value = tx.slp.detail.outputs.reduce((accumulator, currentValue) => {
          if (currentValue.address && currentValue.amount) {
            const outputAddress = SLP.Address.toCashAddress(
              currentValue.address
            );
            if (
              outputAddress === toAddress ||
              (toAddress === address && outputAddress === addressSlp)
            ) {
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
          fromAddresses: fromAddresses,
          toAddresses: toAddresses,
          value: value.toNumber(),
          sendTokenData: {
            tokenProtocol: "slp",
            tokenId: tx.slp.detail.tokenIdHex
          }
        },
        time: tx.blk && tx.blk.t ? tx.blk.t * 1000 : new Date().getTime(),
        block: tx.blk && tx.blk.i ? tx.blk.i : 0,
        status: "confirmed",
        network: "mainnet"
        // loadingDefaults: false, // safe to remove?
      };
    });

    const formattedTransactionsAll = [
      ...formattedTransactionsBCH,
      ...formattedTransactionsSLP
    ];

    dispatch(getTransactionsSuccess(formattedTransactionsAll, address));
  };
};

export { updateTransactions };
