import React, { useEffect } from "react";
import styled from "styled-components";
import { SafeAreaView, ActivityIndicator } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { connect, ConnectedProps } from "react-redux";

import { Spacer, T } from "../atoms";

import { hasMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";
import { FullState } from "../data/store";

const ScreenWrapper = styled(SafeAreaView)`
  align-items: center;
  justify-content: center;
  flex: 1;
`;

type PropsFromParent = NavigationScreenProps & {};

// Redux connection
const mapStateToProps = (state: FullState) => ({
  isCreated: hasMnemonicSelector(state)
});

const mapDispatchToProps = {
  getAccount
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & PropsFromParent;

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

export default connector(CreateWalletScreen);
