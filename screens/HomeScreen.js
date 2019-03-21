// @flow

import React from "react";
import styled from "styled-components";
import { Text, SafeAreaView } from "react-native";

import { connect } from "react-redux";

import { getAddressSelector } from "../data/accounts/selectors";

type Props = {
  address: string
};

const HomeScreen = ({ address }: Props) => (
  <SafeAreaView>
    <Text>Main wallet screen</Text>
    <Text>{address}</Text>
  </SafeAreaView>
);

const mapStateToProps = state => ({ address: getAddressSelector(state) });
const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
