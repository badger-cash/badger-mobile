// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { Text, SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { getAddressSelector } from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { updateBalances } from "../data/utxos/actions";

type Props = {
  address: string,
  updateTransactions: Function,
  updateBalances: Function
};

const HomeScreen = ({ address, updateTransactions, updateBalances }: Props) => {
  // useEffect(() => {
  //   updateTransactions(address);
  // }, []);

  return (
    <SafeAreaView>
      <Text>Main wallet screen!!</Text>
      <Text>{address}</Text>

      <TouchableOpacity
        onPress={() => updateTransactions(address)}
        title="Update Addresses"
      >
        <Text>Update Addresses</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => updateBalances(address)}
        title="Update Balances"
      >
        <Text>Update Balances </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({ address: getAddressSelector(state) });
const mapDispatchToProps = {
  updateTransactions,
  updateBalances
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
