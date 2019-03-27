// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { T, H1, Spacer } from "../atoms";

import { CoinRow } from "../components";

import { balancesSelector } from "../data/selectors";
import { getAddressSelector } from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";

import { formatAmount } from "../utils/balance-utils";

const SECOND = 1000;
const MINUTE = 60 * SECOND;

type Props = {
  address: string,
  updateTransactions: Function,
  updateUtxos: Function,
  bchBalance: number
};

const HomeScreen = ({
  address,
  updateTransactions,
  updateUtxos,
  balances
}: Props) => {
  useEffect(() => {
    setInterval(() => updateUtxos(address), 15 * SECOND);
  }, []);

  const { slpTokens } = balances;

  return (
    <SafeAreaView>
      <Spacer small />
      <H1 center>Badger Mobile</H1>
      <Spacer />
      <T center>{address}</T>
      <Spacer />
      <CoinRow
        ticker="BCH"
        name="Bitcoin Cash"
        amount={formatAmount(balances.satoshisAvailable, 8)}
        extra="$0.000 USD"
      />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />
      <Spacer />

      <TouchableOpacity
        onPress={() => updateTransactions(address)}
        title="Update Transactions"
      >
        <T center>Update Transactions</T>
      </TouchableOpacity>
      <Spacer />
      <TouchableOpacity
        onPress={() => updateUtxos(address)}
        title="Update Balances"
      >
        <T center>Update Balances </T>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const address = getAddressSelector(state);
  const balances = balancesSelector(state, address);
  return {
    address,
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
