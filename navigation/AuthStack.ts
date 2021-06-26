import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import WelcomeScreen from "../screens/WelcomeScreen";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import PrivacyNoticeScreen from "../screens/PrivacyNoticeScreen";
import CreateWalletScreen from "../screens/CreateWalletScreen";

import RestoreWalletScreen from "../screens/RestoreWalletScreen";

const AuthStack = createCompatNavigatorFactory(createStackNavigator)(
  {
    Welcome: {
      screen: WelcomeScreen
    },
    AcceptTermsOfUse: {
      screen: TermsOfUseScreen
    },
    PrivacyNotice: {
      screen: PrivacyNoticeScreen
    },
    CreateWallet: {
      screen: CreateWalletScreen
    }, // Create a password here also?
    RestoreFromBackup: {
      screen: RestoreWalletScreen
    }
  },
  {
    headerMode: "none",
    initialRouteName: "Welcome"
  }
);

export default AuthStack;
