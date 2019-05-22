// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";
import SendSuccessScreen from "../screens/SendSuccessScreen";

import { spaceBadger as theme } from "../themes/spaceBadger";

const SendStack = createStackNavigator(
  {
    SendSetup: {
      screen: SendSetupScreen,
      navigationOptions: {
        title: "Setup Transaction"
      }
    },
    SendConfirm: {
      screen: SendConfirmScreen,
      navigationOptions: {
        title: "Confirm & Send"
      }
    },
    SendSuccess: {
      screen: SendSuccessScreen,
      navigationOptions: { header: null }
    }
  },
  {
    initialRouteName: "SendSetup",
    headerLayoutPreset: "center",
    defaultNavigationOptions: {
      headerBackTitleStyle: {
        color: theme.primary500
      },
      headerTintColor: theme.primary500,
      headerTitleStyle: { color: theme.fg100 }
    }
  }
);

export default SendStack;
