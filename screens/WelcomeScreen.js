// @flow

import React from "react";
import { SafeAreaView, View, Image } from "react-native";
import styled from "styled-components";

import { T, H1, H2, Spacer, Button } from "../atoms";

import BadgerIcon from "../assets/images/icon.png";

const StyledWrapper = styled(SafeAreaView)`
  display: flex;
  flex: 1;
  align-items: center;
`;

type Props = { navigation: { navigate: Function } };

const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <StyledWrapper>
      <Spacer />
      <H1>Badger Mobile </H1>
      <H2 type="muted2">RC1</H2>
      <Spacer />
      <Image source={BadgerIcon} style={{ width: 150, height: 150 }} />
      <Spacer />
      <View style={{ flex: 1 }}>
        <T style={{ textAlign: "center" }}>
          Your gateway to the world of Bitcoin Cash (BCH) apps
        </T>
      </View>

      <View style={{ flex: 1 }}>
        <Button
          onPress={() => navigation.navigate("CreateWallet")}
          text="New Wallet"
        />
        <Spacer small />
        <Button
          onPress={() => navigation.navigate("RestoreFromBackup")}
          text="Restore Wallet"
        />
      </View>
    </StyledWrapper>
  );
};

export default WelcomeScreen;
