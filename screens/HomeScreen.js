// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { T, H1, Spacer } from "../atoms";

import { CoinRow } from "../components";

import { balancesSelector } from "../data/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";

import { formatAmount } from "../utils/balance-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type Props = {
  address: string,
  addressSlp: string,
  updateTransactions: Function,
  updateUtxos: Function,
  bchBalance: number,
  balances: any
};

const HomeScreen = ({
  address,
  addressSlp,
  updateTransactions,
  updateUtxos,
  balances
}: Props) => {
  useEffect(() => {
    updateUtxos(address);
    const utxointerval = setInterval(() => updateUtxos(address), 15 * SECOND);
    return () => clearInterval(utxointerval);
  }, [address]);

  const slpTokens = balances.slpTokens;

  const slpTokensDisplay = Object.keys(slpTokens).map(key => [
    key,
    slpTokens[key]
  ]);

  console.log(addressSlp);
  console.log(address);

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
          <T>
            {tokenId} - {formatAmount(amount, 8)}
          </T>
        );
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
  return {
    address,
    addressSlp,
    balances
  };
};
const mapDispatchToProps = {
  updateTransactions,
  updateUtxos
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
