import React from "react";
import { View, ScrollView, SafeAreaView } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import _ from "lodash";

import { Button, T, Spacer, SwipeButton } from "../atoms";
import { logoutAccount } from "../data/accounts/actions";
import { FullState } from "../data/store";

import lang from "../_locales/index";
var tran = new lang("LogoutScreen");

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
        <T center>{tran.getStr("about_to_logout")}</T>
        <Spacer />
        <T center>{tran.getStr("Make_sure")}</T>
        <Spacer />
        <T center>{tran.getStr("If_the_seed")}</T>
        <Spacer small />

        <Spacer fill />

        <ButtonContainer>
          <Button
            nature="cautionGhost"
            text={tran.getStr("Btn_Cancel")}
            onPress={() => navigation.goBack()}
          />
          <Spacer />
          <SwipeButton
            swipeFn={() => {
              logoutAccount();

              _.delay(() => navigation.navigate("AuthLoadingCheck"), 25);
            }}
            labelAction={tran.getStr("SwipeButton_labelAction")}
            labelRelease={tran.getStr("SwipeButton_labelRelease")}
            labelHalfway={tran.getStr("SwipeButton_labelHalfway")}
          />
        </ButtonContainer>
        <Spacer />
      </ScrollView>
    </Screen>
  );
};

export default connector(LogoutScreen);
