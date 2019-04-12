// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { View, SafeAreaView } from "react-native";
import styled from "styled-components";

import { getAddressSelector } from "../data/accounts/selectors";
import { updateUtxos } from "../data/utxos/actions";

import { T } from "../atoms";

const ScreenCover = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.success500};
`;

type Props = {
  navigation: { navigate: Function, state: { params: { txParams: any } } },
  // address: string,
  updateUtxos: Function
};
const SendSuccessScreen = ({ navigation, updateUtxos }: Props) => {
  const { txParams } = navigation.state.params;
  const { to, from, amount, data } = txParams;

  useEffect(() => {
    updateUtxos(from);
  }, [from]);

  return (
    <ScreenCover>
      <SafeAreaView>
        <T>Send Success!</T>
      </SafeAreaView>
    </ScreenCover>
  );
};

const mapStateToProps = state => ({});

const mapDispatchToProps = {
  updateUtxos
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendSuccessScreen);
