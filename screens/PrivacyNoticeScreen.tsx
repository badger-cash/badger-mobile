import React from "react";
import styled from "styled-components";
import { SafeAreaView, Text, Linking } from "react-native";

import { H1, T, Spacer, Button } from "../atoms";

type Props = {
  navigation: any;
};

const ScreenView = styled(SafeAreaView)`
  margin: 0 16px;
`;

// Edit - This version no longer used, was used in onboarding.  Maybe remove
const PrivacyNoticeScreen = ({ navigation }: Props) => {
  return (
    <ScreenView
      style={{
        flex: 1
      }}
    >
      <Spacer large />
      <H1 center>Privacy Overview</H1>
      <Spacer />
      <T center>Privacy is important. We will respect yours.</T>
      <Spacer />
      <T center>To view our complete privacy policy visit</T>
      <Spacer small />
      <T
        center
        onPress={() =>
          Linking.openURL("https://www.bitcoin.com/privacy-policy")
        }
      >
        https://www.bitcoin.com/privacy-policy
      </T>

      <Spacer fill />
      <Button
        onPress={() => navigation.navigate("AcceptTermsOfUse")}
        text="Accept"
      />
      <Spacer />
    </ScreenView>
  );
};

// Accessed from Menu List
const ViewPrivacyNoticeScreen = ({ navigation }: Props) => {
  return (
    <ScreenView
      style={{
        flex: 1
      }}
    >
      <Spacer large />
      <H1 center>Privacy Overview</H1>
      <Spacer />
      <T center>Privacy is important. We will respect yours.</T>
      <Spacer />
      <T center>To view our complete privacy policy visit</T>
      <Spacer small />
      <T
        center
        onPress={() =>
          Linking.openURL("https://www.bitcoin.com/privacy-policy")
        }
      >
        https://www.bitcoin.com/privacy-policy
      </T>

      <Spacer fill />
      <Button onPress={() => navigation.goBack()} text="Accept" />
      <Spacer />
    </ScreenView>
  );
};

export { ViewPrivacyNoticeScreen };
export default PrivacyNoticeScreen;
