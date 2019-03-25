// @flow

import React, { useEffect } from "react";
import styled from "styled-components";
import { Text, SafeAreaView } from "react-native";

import { connect } from "react-redux";

import { getAddressSelector } from "../data/accounts/selectors";
import { updateTransactions } from "../data/transactions/actions";

type Props = {
  address: string,
  updateTransactions: Function
};

const HomeScreen = ({ address, updateTransactions }: Props) => {
  useEffect(() => {
    updateTransactions(address);
  }, []);

  return (
    <SafeAreaView>
      <Text>Main wallet screen</Text>
      <Text>{address}</Text>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({ address: getAddressSelector(state) });
const mapDispatchToProps = {
  updateTransactions
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
