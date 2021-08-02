import React from "react";

import { createStackNavigator } from "@react-navigation/stack";
import { createCompatNavigatorFactory } from "@react-navigation/compat";

import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";
import SendSuccessScreen from "../screens/SendSuccessScreen";
import Bip70ConfirmScreen from "../screens/Bip70ConfirmScreen";
import Bip70SuccessScreen from "../screens/Bip70SuccessScreen";

import { spaceBadger as theme } from "../themes/spaceBadger";

const SendStackOld = createCompatNavigatorFactory(createStackNavigator)(
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
    Bip70Confirm: {
      screen: Bip70ConfirmScreen,
      navigationOptions: {
        title: "Payment Request"
      }
    },
    Bip70Success: {
      screen: Bip70SuccessScreen,
      navigationOptions: {
        header: null
      }
    },
    SendSuccess: {
      screen: SendSuccessScreen,
      navigationOptions: {
        header: null
      }
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
      headerTitleStyle: {
        color: theme.fg100
      }
    }
  }
);

export default SendStack;
