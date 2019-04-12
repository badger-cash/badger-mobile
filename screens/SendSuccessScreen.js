// @flow

import React from "react";
import { View, SafeAreaView } from "react-native";
import styled from "styled-components";

import { T } from "../atoms";

const ScreenWrapper = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.success500};
`;

const SendSuccessScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <SafeAreaView>
        <T>Send Success!</T>
      </SafeAreaView>
    </ScreenWrapper>
  );
};

export default SendSuccessScreen;
