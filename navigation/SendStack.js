// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";

const SendStack = createStackNavigator(
  {
    SendSetup: {
      screen: SendSetupScreen
    },
    SendConfirm: { screen: SendConfirmScreen }
  },
  {
    headerMode: "none",
    initialRouteName: "SendSetup"
  }
);

export default SendStack;
