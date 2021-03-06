import React from "react";

import { createStackNavigator } from "react-navigation";

import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";
import SendSuccessScreen from "../screens/SendSuccessScreen";
import Bip70ConfirmScreen from "../screens/Bip70ConfirmScreen";
import Bip70SuccessScreen from "../screens/Bip70SuccessScreen";

import { spaceBadger as theme } from "../themes/spaceBadger";

import lang from "../_locales/index";
var tran = new lang("SendStack");

const SendStack = createStackNavigator(
  {
    SendSetup: {
      screen: SendSetupScreen,
      navigationOptions: {
        title: tran.getStr("Setup_Transaction")
      }
    },
    SendConfirm: {
      screen: SendConfirmScreen,
      navigationOptions: {
        title: tran.getStr("Confirm & Send")
      }
    },
    Bip70Confirm: {
      screen: Bip70ConfirmScreen,
      navigationOptions: {
        title: tran.getStr("Payment Request")
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
