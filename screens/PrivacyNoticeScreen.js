// @flow

import React from "react";
import styled from "styled-components";
import { SafeAreaView, Text, Button } from "react-native";

import { H1, Spacer } from "../atoms";

type Props = { navigation: any };

const ScreenView = styled(SafeAreaView)`
  align-items: center;
`;

class PrivacyNoticeScreen extends React.Component<Props> {
  render() {
    const { navigation } = this.props;
    return (
      <ScreenView>
        <Spacer large />
        <H1>Privacy Overview</H1>
        <Spacer />
        <Text>Privacy is important. We will respect yours.</Text>
        <Button
          onPress={() => navigation.navigate("AcceptTermsOfUse")}
          title="Accept"
        />
      </ScreenView>
    );
  }
}

export default PrivacyNoticeScreen;
