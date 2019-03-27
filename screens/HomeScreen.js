// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { Text, SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { T, Spacer } from "../atoms";
import { bchBalanceSelector } from "../data/selectors";
import { getAddressSelector } from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";

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
  bchBalance
}: Props) => {
  // useEffect(() => {
  //   updateTransactions(address);
  // }, []);

  return (
    <SafeAreaView>
      <T>Main wallet screen!!</T>
      <Spacer />
      <T>{address}</T>
      <Spacer />
      <T>{bchBalance} BCH</T>
      <Spacer />
      <Spacer />

      <TouchableOpacity
        onPress={() => updateTransactions(address)}
        title="Update Transactions"
      >
        <T>Update Transactions</T>
      </TouchableOpacity>
      <Spacer />
      <TouchableOpacity
        onPress={() => updateUtxos(address)}
        title="Update Balances"
      >
        <T>Update Balances </T>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const address = getAddressSelector(state);
  const bchBalance = bchBalanceSelector(state, address);
  return {
    address,
    bchBalance
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
