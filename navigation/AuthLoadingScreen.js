// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";

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
    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);
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
        <T monospace>🦡🦡🦡🦡🦡🦡🦡🦡🦡🦡</T>
        <T monospace>🦡🦡🦡🦡🦡🦡🦡🦡🦡🦡</T>
        <T monospace>🦡 Herding Badgers 🦡</T>
        <T monospace>🦡🦡🦡🦡🦡🦡🦡🦡🦡🦡</T>
        <T monospace>🦡🦡🦡🦡🦡🦡🦡🦡🦡🦡</T>
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
