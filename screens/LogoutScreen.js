// @flow

import React from "react";
import { View, SafeAreaView } from "react-native";
import { connect } from "react-redux";
import styled from "styled-components";

import { Button, T, H1, H2, Spacer } from "../atoms";
import { logoutAccount } from "../data/accounts/actions";

const ButtonContainer = styled(View)``;
const Screen = styled(SafeAreaView)`
  flex: 1;
  margin-left: 5px;
  margin-right: 5px;
`;

type Props = {
  navigation: { navigate: Function, goBack: Function },
  logoutAccount: Function
};
const LogoutScreen = ({ navigation, logoutAccount }: Props) => {
  return (
    <Screen style={{ flex: 1 }}>
      <Spacer small />
      <H1 center>Logout?</H1>
      <Spacer small />
      <T center>
        You are about to logout of your wallet. You need to use your seed phrase
        to access this account again.
      </T>
      <Spacer />
      <T center>
        Make sure you have the seed phrase written down and stored in a secure
        location before logging out.
      </T>
      <Spacer />
      <T center>
        If the seed phrase is lost, we are unable to recover it for you.
      </T>
      <Spacer fill />
      <ButtonContainer>
        <Button
          nature="cautionGhost"
          text="Cancel"
          onPress={() => navigation.goBack()}
        />
        <Spacer />
        <Button
          text="Yes, Logout"
          onPress={() => {
            logoutAccount();
            navigation.navigate("AuthLoadingCheck");
          }}
        />
      </ButtonContainer>
      <Spacer />
    </Screen>
  );
};
const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = {
  logoutAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LogoutScreen);
