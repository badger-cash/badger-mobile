// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";
import SendSuccessScreen from "../screens/SendSuccessScreen";

const SendStack = createStackNavigator(
  {
    SendSetup: {
      screen: SendSetupScreen
    },
    SendConfirm: { screen: SendConfirmScreen },
    SendSuccess: { screen: SendSuccessScreen }
  },
  {
    headerMode: "none",
    initialRouteName: "SendSetup"
  }
);

export default SendStack;
