import React, { useEffect } from "react";
import styled from "styled-components";
import { SafeAreaView, ActivityIndicator } from "react-native";
import { connect } from "react-redux";

import { Spacer, T } from "../atoms";

import { hasMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";
import { FullState } from "../data/store";

const ScreenWrapper = styled(SafeAreaView)`
  align-items: center;
  justify-content: center;
  flex: 1;
`;

type Props = {
  navigation: {
    navigate: Function;
  };
  isCreated: boolean;
  getAccount: Function;
};

const CreateWalletScreen = ({ navigation, isCreated, getAccount }: Props) => {
  useEffect(() => {
    if (isCreated) {
      navigation.navigate("Home");
    } else {
      getAccount();
    }
  }, [isCreated]);

  return (
    <ScreenWrapper>
      <ActivityIndicator />
      <Spacer />
      <T monospace>Loading Wallet...</T>
    </ScreenWrapper>
  );
};

const mapStateToProps = (state: FullState) => ({
  isCreated: hasMnemonicSelector(state)
});

const mapDispatchToProps = {
  getAccount
};

export default connect(mapStateToProps, mapDispatchToProps)(CreateWalletScreen);
