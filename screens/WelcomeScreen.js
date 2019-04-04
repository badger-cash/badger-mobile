// @flow

import React from "react";
import { SafeAreaView, View, Text, Image, TextInput } from "react-native";
import styled, { css } from "styled-components";

import { T, H1, Spacer, Button } from "../atoms";

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
      <H1>Badger | Alpha</H1>
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
          onPress={() => navigation.navigate("PrivacyNotice")}
          text="Create new wallet"
        />
        <Spacer small />
        <Button
          onPress={() => navigation.navigate("RestoreFromBackup")}
          text="Restore from backup phrase"
        />
      </View>
    </StyledWrapper>
  );
};

export default WelcomeScreen;
