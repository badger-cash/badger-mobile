// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { Text, SafeAreaView, TouchableOpacity } from "react-native";

import { connect } from "react-redux";

import { getAddressSelector } from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";

type Props = {
  address: string,
  updateTransactions: Function,
  updateUtxos: Function
};

const HomeScreen = ({ address, updateTransactions, updateUtxos }: Props) => {
  // useEffect(() => {
  //   updateTransactions(address);
  // }, []);

  return (
    <SafeAreaView>
      <Text>Main wallet screen!!</Text>
      <Text>{address}</Text>

      <TouchableOpacity
        onPress={() => updateTransactions(address)}
        title="Update Transactions"
      >
        <Text>Update Addresses</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => updateUtxos(address)}
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
  updateUtxos
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
