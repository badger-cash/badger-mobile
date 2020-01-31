import React from "react";
import { View, ScrollView, SafeAreaView } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import _ from "lodash";

import { Button, T, Spacer, SwipeButton } from "../atoms";
import { logoutAccount } from "../data/accounts/actions";
import { FullState } from "../data/store";

const ButtonContainer = styled(View)``;
const Screen = styled(SafeAreaView)`
  flex: 1;
  margin: 0 16px;
`;

type PropsFromParent = NavigationScreenProps & {};

const mapStateToProps = (state: FullState) => {
  return {};
};

const mapDispatchToProps = {
  logoutAccount
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const LogoutScreen = ({ navigation, logoutAccount }: Props) => {
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1
        }}
      >
        <Spacer />
        <T center>
          You are about to logout of your wallet. You will need to use this
          wallets seed phrase to access the held funds again.
        </T>
        <Spacer />
        <T center>
          Make sure you have the seed phrase backed up in a secure location
          before logging out.
        </T>
        <Spacer />
        <T center>
          If the seed phrase is lost, we are unable to recover the wallet for
          you.
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
          <SwipeButton
            swipeFn={() => {
              logoutAccount();

              _.delay(() => navigation.navigate("AuthLoadingCheck"), 25);
            }}
            labelAction="To Logout"
            labelRelease="Release to logout"
            labelHalfway="Keep going"
          />
        </ButtonContainer>
        <Spacer />
      </ScrollView>
    </Screen>
  );
};

export default connector(LogoutScreen);
