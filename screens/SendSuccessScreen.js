// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { View, SafeAreaView } from "react-native";
import styled from "styled-components";

import { getAddressSelector } from "../data/accounts/selectors";
import { updateUtxos } from "../data/utxos/actions";

import { Button, T, Spacer, H1 } from "../atoms";

const ScreenCover = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.success500};
`;

type Props = {
  navigation: { navigate: Function, state: { params: { txParams: any } } },
  address: string,
  updateUtxos: Function
};
const SendSuccessScreen = ({ address, navigation, updateUtxos }: Props) => {
  const { txParams } = navigation.state.params;
  const { to, from, amount, data } = txParams;

  useEffect(() => {
    updateUtxos(address);
  }, [address]);

  return (
    <ScreenCover>
      <SafeAreaView>
        <Spacer />
        <H1>Send Success</H1>
        <Button onPress={() => navigation.navigate("Home")} text="Done" />
      </SafeAreaView>
    </ScreenCover>
  );
};

const mapStateToProps = state => ({
  address: getAddressSelector(state)
});

const mapDispatchToProps = {
  updateUtxos
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendSuccessScreen);
