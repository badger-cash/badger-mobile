import BigNumber from "bignumber.js";

import {
  GET_TRANSACTIONS_START,
  GET_TRANSACTIONS_SUCCESS,
  GET_TRANSACTIONS_FAIL
} from "./constants";

import { getTransactionsByAddress } from "../../api/bcash";

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

    const transactionsBCH = getTransactionsByAddress(address);

    const transactionsSlp = getTransactionsByAddress(addressSlp);

    let [bchHistory, slpHistory] = await Promise.all([
      transactionsBCH,
      transactionsSlp
    ]);

    const slpInBch = bchHistory.filter(t => t.slpToken);
    const bchInSlp = slpHistory.filter(t => !t.slpToken);

    bchHistory = [...bchHistory.filter(t => !t.slpToken), ...bchInSlp];
    slpHistory = [...slpHistory.filter(t => t.slpToken), ...slpInBch];

    const formattedTransactionsBCH: Transaction[] = [];

    for (let tx of bchHistory) {
      const block = tx.height > 0 ? tx.height : 0;
      const hash = tx.hash;

      // Unconfirmed or already parsed, skip
      if (allTxIds.has(hash)) {
        const existingTx = currentState.transactions.byId[hash];
        if (existingTx.block == block) continue;
      }

      // All input addresses in CashAddress format
      const fromAddressesAll = tx.inputs.map(input => input.coin.address);

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
      const toAddressesAll = tx.outputs
        .map(output => output.address)
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
        value = tx.outputs.reduce((accumulator, currentOut) => {
          const address = currentOut.address;
          if (
            address &&
            valueAddresses.includes(
              bchaddr.toCashAddress(address.replace("bitcoincash:", ""))
            )
          ) {
            accumulator += currentOut.value;
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
        time: tx.time * 1000 || new Date().getTime(),
        block,
        networkId: "mainnet"
      };

      formattedTx && formattedTransactionsBCH.push(formattedTx);
    }

    const formattedTransactionsSLP: Transaction[] = [];

    const addressSimpleledger = bchaddr.toSlpAddress(
      address.replace("bitcoincash:", "")
    );
    const addressSlpSimpleledger = bchaddr.toSlpAddress(
      addressSlp.replace("bitcoincash:", "")
    );

    for (let tx of slpHistory) {
      const block = tx.height > 0 ? tx.height : 0;
      const hash = tx.hash;

      // Unconfirmed or already parsed, skip
      if (allTxIds.has(hash)) {
        const existingTx = currentState.transactions.byId[hash];
        if (existingTx.block == block) continue;
      }

      const slp = tx.slpToken;
      const tokenIdHex = tx.slpToken.tokenId;

      const inputs = tx.inputs;
      const outputs = tx.outputs;
      const decimals = slp.decimals;
      const transactionType =
        outputs[1].slp.type == "GENESIS"
          ? 4
          : outputs[1].slp.type == "MINT"
          ? 5
          : 6;

      // All from addresses in simpleledger format
      // const fromAddresses = inputs.map(input => input?.e?.a).filter(Boolean);
      const fromAddresses = inputs
        .map(input => {
          if (input.coin.slp)
            return bchaddr.toSlpAddress(
              input.coin.address.replace("bitcoincash:", "")
            );
          else
            return bchaddr.toCashAddress(
              input.coin.address.replace("bitcoincash:", "")
            );
        })
        .filter(a => a);

      // All to addresses

      const toAddressesSLP: string[] = [];
      const toAddressesBCH: string[] = [];
      for (let out of outputs) {
        const address = out.address;
        if (!address) continue;
        if (out.slp)
          toAddressesSLP.push(
            bchaddr.toSlpAddress(address.replace("bitcoincash:", ""))
          );
        else
          toAddressesBCH.push(
            bchaddr.toCashAddress(address.replace("bitcoincash:", ""))
          );
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
        const address = out.address;
        if (
          address &&
          valueAddressesSLP.includes(
            bchaddr.toSlpAddress(address.replace("bitcoincash:", ""))
          )
        ) {
          const slpAmount = Number(out.slp.value) / 10 ** decimals;
          accumulator = accumulator.plus(new BigNumber(slpAmount));
        }

        return accumulator;
      }, new BigNumber(0));

      let bchValue = 0;

      if (toAddress && fromAddress !== toAddress) {
        // Determine BCH value
        bchValue = outputs.reduce((accumulator, out) => {
          const address = out.address;
          if (
            address &&
            valueAddressesBCH.includes(
              bchaddr.toCashAddress(address.replace("bitcoincash:", ""))
            )
          ) {
            accumulator = accumulator + out.value;
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
        time: tx.time * 1000 || new Date().getTime(),
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
