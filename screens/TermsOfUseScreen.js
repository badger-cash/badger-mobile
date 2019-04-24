// @flow

import React from "react";
import styled from "styled-components";
import { SafeAreaView, Text, Button } from "react-native";

import { H1, Spacer } from "../atoms";

type Props = { navigation: any };

const ScreenView = styled(SafeAreaView)`
  align-items: center;
`;

const TermsOfUseScreen = ({ navigation }: Props) => {
  return (
    <ScreenView>
      <Spacer large />
      <H1>Terms of Use</H1>
      <Spacer />
      <Text>TODO - Minimal and clear.</Text>
      <Button
        onPress={() => navigation.navigate("CreateWallet")}
        title="Accept"
      />
    </ScreenView>
  );
};
export default TermsOfUseScreen;
