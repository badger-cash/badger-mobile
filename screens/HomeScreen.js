// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { T, H1, Spacer } from "../atoms";

import { CoinRow } from "../components";

import { balancesSelector, type Balances } from "../data/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { type TokenData } from "../data/tokens/reducer";

import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";
import { updateTokensMeta } from "../data/tokens/actions";

import { formatAmount } from "../utils/balance-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type Props = {
  address: string,
  addressSlp: string,
  updateTransactions: Function,
  updateUtxos: Function,
  updateTokensMeta: Function,
  balances: Balances,
  tokensById: { [tokenId: string]: TokenData }
};

const HomeScreen = ({
  address,
  addressSlp,
  updateTransactions,
  updateUtxos,
  updateTokensMeta,
  tokensById,
  balances
}: Props) => {
  useEffect(() => {
    // Update UTXOs on an interval
    updateUtxos(address);
    const utxointerval = setInterval(() => updateUtxos(address), 15 * SECOND);
    return () => clearInterval(utxointerval);
  }, [address]);

  const tokenIds = Object.keys(balances.slpTokens);

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = tokenIds.filter(tokenId => !tokensById[tokenId]);
    updateTokensMeta(missingTokenIds);
  }, [...tokenIds]);

  const slpTokens = balances.slpTokens;

  const slpTokensDisplay = Object.keys(slpTokens).map(key => [
    key,
    slpTokens[key]
  ]);

  console.log(addressSlp);
  console.log(address);
  // console.log(tokensById)

  return (
    <SafeAreaView>
      <Spacer small />
      <H1 center>Badger Mobile</H1>
      <Spacer />
      <T center>{address}</T>
      <Spacer />
      <Spacer />
      <T center>{addressSlp}</T>
      <Spacer />
      <CoinRow
        ticker="BCH"
        name="Bitcoin Cash"
        amount={formatAmount(balances.satoshisAvailable, 8)}
        extra="$0.000 USD"
      />
      {slpTokensDisplay.map(([tokenId, amount]) => {
        return (
          <CoinRow
            key={tokenId}
            ticker={tokensById[tokenId].symbol}
            name={tokensById[tokenId].name}
            amount={formatAmount(amount, tokensById[tokenId].decimals)}
            extra="Simple Ledger Protocol"
          />
        );
        {
          /* return (
          <T key={tokenId}>
            {tokenId} - {formatAmount(amount, 8)}
          </T>
        ); */
        }
      })}
      <Spacer />
      <Spacer />
      <Spacer />

      <TouchableOpacity onPress={() => updateTransactions(address)}>
        <T center>Update Transactions</T>
      </TouchableOpacity>
      <Spacer />
      <TouchableOpacity onPress={() => updateUtxos(address)}>
        <T center>Update Balances </T>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);

  const tokensById = tokensByIdSelector(state);

  return {
    address,
    addressSlp,
    balances,
    tokensById
  };
};
const mapDispatchToProps = {
  updateTransactions,
  updateUtxos,
  updateTokensMeta
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
