import BigNumber from "bignumber.js";

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import { getTransactionsByAddress } from "../../api/grpc";

import { Transaction } from "./reducer";
import { transactionsLatestBlockSelector } from "../selectors";
import { transactionsSelector } from "./selectors";

import bchaddr from "bchaddrjs-slp";
import { isConstructSignatureDeclaration } from "typescript";

const appendBCHPrefix = (target: string) => `bitcoincash:${target}`;

const getTransactionsStart = () => ({
  type: GET_TRANSACTIONS_START,
  payload: null
});

const getTransactionsSuccess = (
  transactions: Transaction[],
  address: string,
  timestamp: number
) => ({
  type: GET_TRANSACTIONS_SUCCESS,
  payload: {
    transactions,
    address,
    timestamp
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
    // if (isUpdating && now - lastUpdate < 1000 * 60 * 7) {
    //   return;
    // }

    dispatch(getTransactionsStart());

    const latestBlock = transactionsLatestBlockSelector(currentState);
    const allTxIds = new Set(transactionsSelector(currentState).allIds);

    // const transactionsBCH = getHistoricalBchTransactions(
    //   address,
    //   addressSlp,
    //   latestBlock
    // );

    // const transactionsSlp = getHistoricalSlpTransactions(
    //   address,
    //   addressSlp,
    //   latestBlock
    // );

    const transactionsBCH = getTransactionsByAddress(address, latestBlock);

    const transactionsSlp = getTransactionsByAddress(addressSlp, latestBlock);

    let [bchHistory, slpHistory] = await Promise.all([
      transactionsBCH,
      transactionsSlp
    ]);

    const slpInBch = bchHistory.filter(
      t => t.getSlpTransactionInfo().getSlpAction() > 0
    );
    const bchInSlp = slpHistory.filter(
      t => t.getSlpTransactionInfo().getSlpAction() == 0
    );

    bchHistory = [
      ...bchHistory.filter(t => t.getSlpTransactionInfo().getSlpAction() == 0),
      ...bchInSlp
    ];
    slpHistory = [
      ...slpHistory.filter(t => t.getSlpTransactionInfo().getSlpAction() > 0),
      ...slpInBch
    ];

    const formattedTransactionsBCH: Transaction[] = [];

    for (let tx of bchHistory) {
      const block = tx.getBlockHeight();
      const hash = Buffer.from(tx.getHash_asU8().reverse()).toString("hex");

      // Unconfirmed and already parsed, skip
      if (block === 0 && allTxIds.has(hash)) {
        continue;
      }

      // All input addresses in CashAddress format
      const fromAddressesAll = tx
        .getInputsList()
        .map(input => bchaddr.toCashAddress(input.getAddress()));

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

      // All transaction output address, in CashAddr format
      const toAddressesAll = tx
        .getOutputsList()
        .map(output => {
          const address = output.getAddress();
          if (address != "") return bchaddr.toCashAddress(address);
        })
        .filter(a => a);

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
        value = tx.getOutputsList().reduce((accumulator, currentOut) => {
          const address = currentOut.getAddress();
          if (
            address != "" &&
            valueAddresses.includes(bchaddr.toCashAddress(address))
          ) {
            accumulator += currentOut.getValue();
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
        time: tx.getTimestamp() * 1000 || new Date().getTime(),
        block,
        networkId: "mainnet"
      };

      formattedTx && formattedTransactionsBCH.push(formattedTx);
    }

    const formattedTransactionsSLP: Transaction[] = [];

    const addressSimpleledger = bchaddr.toSlpAddress(address);
    const addressSlpSimpleledger = bchaddr.toSlpAddress(addressSlp);

    for (let tx of slpHistory) {
      const block = tx.getBlockHeight();
      const hash = Buffer.from(tx.getHash_asU8().reverse()).toString("hex");

      // Unconfirmed and already parsed, skip
      if (block === 0 && allTxIds.has(hash)) {
        continue;
      }

      const slp = tx.getSlpTransactionInfo();
      const tokenIdHex = Buffer.from(slp.getTokenId_asU8()).toString("hex");

      const inputs = tx.getInputsList();
      const outputs = tx.getOutputsList();
      const decimals = outputs[1].getSlpToken().getDecimals();
      const transactionType = slp.getSlpAction();

      // All from addresses in simpleledger format
      // const fromAddresses = inputs.map(input => input?.e?.a).filter(Boolean);
      const fromAddresses = inputs.map(input => {
        if (input.hasSlpToken())
          return bchaddr.toSlpAddress(input.getAddress());
        else return bchaddr.toCashAddress(input.getAddress());
      });

      // All to addresses

      const toAddressesSLP: string[] = [];
      const toAddressesBCH: string[] = [];
      for (let out of outputs) {
        const address = out.getAddress();
        if (address == "") continue;
        if (out.hasSlpToken())
          toAddressesSLP.push(bchaddr.toSlpAddress(address));
        else toAddressesBCH.push(bchaddr.toCashAddress(address));
      }
      const toAddresses = [...new Set([...toAddressesSLP, ...toAddressesBCH])];

      // Detect if an output is from this wallet
      let fromUser = fromAddresses.reduce((acc, curr) => {
        if (acc) return acc;
        return [addressSimpleledger, addressSlpSimpleledger].includes(curr);
      }, false);

      let fromAddress = fromAddresses.length === 1 ? fromAddresses[0] : null;

      if (!fromAddress) {
        // If sending SLP, show from SLP address over the BCH address
        if (fromAddresses.includes(addressSlpSimpleledger)) {
          fromAddress = addressSlpSimpleledger;
        } else if (fromAddresses.includes(addressSimpleledger)) {
          fromAddress = addressSimpleledger;
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

      // TODO - Further improve the to/from value calculations, larger refactor to this entire section
      const valueAddressesSLP = fromUser
        ? toAddresses.filter(
            target =>
              target.includes("simpleledger") &&
              ![addressSimpleledger, addressSlpSimpleledger].includes(target)
          )
        : toAddresses.filter(
            target =>
              target.includes("simpleledger") &&
              [addressSimpleledger, addressSlpSimpleledger].includes(target)
          );

      const valueAddressesBCH =
        fromUser || interWallet
          ? toAddresses.filter(
              target =>
                target.includes("bitcoincash") &&
                ![addressSimpleledger, addressSlpSimpleledger].includes(target)
            )
          : toAddresses.filter(
              target =>
                target.includes("bitcoincash") &&
                [addressSimpleledger, addressSlpSimpleledger].includes(target)
            );

      // Determine SLP value
      value = outputs.reduce((accumulator, out) => {
        const address = out.getAddress();
        if (
          address != "" &&
          valueAddressesSLP.includes(bchaddr.toSlpAddress(address))
        ) {
          const slpAmount =
            Number(out.getSlpToken().getAmount()) / 10 ** decimals;
          accumulator = accumulator.plus(new BigNumber(slpAmount));
        }

        return accumulator;
      }, new BigNumber(0));

      let bchValue = 0;

      if (toAddress && fromAddress !== toAddress) {
        // Determine BCH value
        bchValue = outputs.reduce((accumulator, out) => {
          const address = out.getAddress();
          if (
            address != "" &&
            valueAddressesBCH.includes(bchaddr.toCashAddress(address))
          ) {
            accumulator = accumulator + out.getValue();
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
          transactionType:
            transactionType == 6
              ? "SEND"
              : transactionType == 5
              ? "MINT"
              : "GENESIS",
          sendTokenData: {
            tokenProtocol: "slp",
            tokenId: tokenIdHex,
            valueToken: value.toFixed(decimals)
          }
        },
        time: tx.getTimestamp() * 1000 || new Date().getTime(),
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

    const updateTime = +new Date();

    dispatch(
      getTransactionsSuccess(formattedTransactionsNew, address, updateTime)
    );
  };
};

export {
  updateTransactions,
  getTransactionsStart,
  getTransactionsFail,
  getTransactionsSuccess
};
