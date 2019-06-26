// @flow

import React from "react";
import styled from "styled-components";

import { SafeAreaView } from "react-native";
import { T } from "../atoms";
type Props = {
  navigation: { navigate: Function }
};
const RequestSetupScreen = (props: Props) => {
  return (
    <SafeAreaView>
      <T>Request Screen</T>
    </SafeAreaView>
  );
};

export default RequestSetupScreen;
