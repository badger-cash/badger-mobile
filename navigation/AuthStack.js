// @flow

import React from "react";

import { createSwitchNavigator, createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import PrivacyNoticeScreen from "../screens/PrivacyNoticeScreen";
import CreateWalletScreen from "../screens/CreateWalletScreen";
// import CreatePasswordScreen from "../screens/CreatePasswordScreen";

// import UnlockScreen from "../screens/UnlockScreen";
import RestoreWalletScreen from "../screens/RestoreWalletScreen";

const AuthStack = createStackNavigator(
  {
    welcome: {
      screen: WelcomeScreen
    },
    acceptTermsOfUse: { screen: TermsOfUseScreen },
    privacyNotice: { screen: PrivacyNoticeScreen },
    createWallet: { screen: CreateWalletScreen },
    // unlock: UnlockScreen,
    restoreFromBackup: { screen: RestoreWalletScreen }
    // createPassword: CreatePasswordScreen
  },
  {
    headerMode: "none"
    // initialRouteName: "welcome"
  }
);

export default AuthStack;
