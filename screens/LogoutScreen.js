// @flow

import React, { useState } from "react";
import { View, ScrollView, SafeAreaView, Dimensions } from "react-native";
import { connect } from "react-redux";
import styled from "styled-components";
import Swipeable from "react-native-swipeable";
import Ionicons from "react-native-vector-icons/Ionicons";
import _ from "lodash";

import { Button, T, Spacer } from "../atoms";
import { logoutAccount } from "../data/accounts/actions";

const ButtonContainer = styled(View)``;
const Screen = styled(SafeAreaView)`
  flex: 1;
  margin-left: 5px;
  margin-right: 5px;
`;

const SwipeButtonContainer = styled(View)`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 32px;
  width: 75%;
  align-self: center;
`;

const SwipeContent = styled(View)`
  height: 64px;
  padding-right: 10px;
  align-items: flex-end;
  justify-content: center;
  background-color: ${props =>
    props.activated ? props.theme.success500 : props.theme.pending500};
`;

const SwipeMainContent = styled(View)`
  height: 64px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  background-color: ${props =>
    props.triggered ? props.theme.success500 : props.theme.primary500};
`;

type Props = {
  navigation: { navigate: Function, goBack: Function },
  logoutAccount: Function
};
const LogoutScreen = ({ navigation, logoutAccount }: Props) => {
  const [confirmSwipeActivated, setConfirmSwipeActivated] = useState(false);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Spacer />
        <T center>
          You are about to logout of your wallet. You need to use your seed
          phrase to access this account again.
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
        <Spacer small />
        <Spacer fill />

        <ButtonContainer>
          <Button
            nature="cautionGhost"
            text="Cancel"
            onPress={() => navigation.goBack()}
          />
          <Spacer />
          <SwipeButtonContainer>
            <Swipeable
              leftActionActivationDistance={
                Dimensions.get("window").width * 0.75 * 0.8
              }
              leftContent={
                <SwipeContent activated={confirmSwipeActivated}>
                  {confirmSwipeActivated ? (
                    <T type="inverse" weight="bold">
                      Release to Logout
                    </T>
                  ) : (
                    <T type="inverse" weight="bold">
                      Keep going
                    </T>
                  )}
                </SwipeContent>
              }
              onLeftActionActivate={() => setConfirmSwipeActivated(true)}
              onLeftActionDeactivate={() => setConfirmSwipeActivated(false)}
              onLeftActionComplete={() => {
                logoutAccount();
                _.delay(() => navigation.navigate("AuthLoadingCheck"), 25);
              }}
            >
              <SwipeMainContent>
                <T weight="bold" type="inverse">
                  Swipe{" "}
                </T>
                <T weight="bold" type="inverse" style={{ paddingTop: 2 }}>
                  <Ionicons name="ios-arrow-round-forward" size={25} />
                </T>
                <T weight="bold" type="inverse">
                  {" "}
                  To Logout
                </T>
              </SwipeMainContent>
            </Swipeable>
          </SwipeButtonContainer>
        </ButtonContainer>
        <Spacer />
      </ScrollView>
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
