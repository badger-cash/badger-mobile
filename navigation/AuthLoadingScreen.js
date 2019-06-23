// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";

import { parseAddress } from "../utils/schemeParser-utils";

const Wrapper = styled(View)`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const InnerWrapper = styled(View)`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

type Props = {
  navigation: { navigate: Function },
  mnemonic: string,
  getAccount: Function
};

const AuthLoadingScreen = ({ navigation, mnemonic, getAccount }: Props) => {
  useEffect(() => {
    const params =
      navigation.state.params !== undefined ? navigation.state.params : "";
    const hasParams = params !== "";

    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);
      if (hasParams) {
        params.address = parseAddress(params.address);
        navigation.navigate("SendStack", params);
      }
      navigation.navigate("Main");
    } else {
      navigation.navigate("AuthStack");
    }
  });

  return (
    <Wrapper>
      <InnerWrapper>
        <ActivityIndicator />
        <Spacer />
        <T monospace>Herding Badgers</T>
      </InnerWrapper>
    </Wrapper>
  );
};

const mapStateToProps = state => ({ mnemonic: getMnemonicSelector(state) });
const mapDispatchToProps = {
  getAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLoadingScreen);
