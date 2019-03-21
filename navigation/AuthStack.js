// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import PrivacyNoticeScreen from "../screens/PrivacyNoticeScreen";
import CreateWalletScreen from "../screens/CreateWalletScreen";

// import UnlockScreen from "../screens/UnlockScreen";
import RestoreWalletScreen from "../screens/RestoreWalletScreen";

const AuthStack = createStackNavigator(
  {
    welcome: {
      screen: WelcomeScreen
    },
    acceptTermsOfUse: { screen: TermsOfUseScreen },
    privacyNotice: { screen: PrivacyNoticeScreen },
    createWallet: { screen: CreateWalletScreen }, // Create a password here also?
    // unlock: UnlockScreen,
    restoreFromBackup: { screen: RestoreWalletScreen }
  },
  {
    headerMode: "none",
    initialRouteName: "welcome"
  }
);

export default AuthStack;
