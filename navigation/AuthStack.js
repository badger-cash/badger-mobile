// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import PrivacyNoticeScreen from "../screens/PrivacyNoticeScreen";
import CreatePasswordScreen from "../screens/CreatePasswordScreen";

import UnlockScreen from "../screens/UnlockScreen";
import RestoreWalletScreen from "../screens/RestoreWalletScreen";

const AuthStack = createStackNavigator(
  {
    welcome: WelcomeScreen,
    termsOfUse: TermsOfUseScreen,
    privacyNotice: PrivacyNoticeScreen,
    unlock: UnlockScreen,
    restore: RestoreWalletScreen,
    createPassword: CreatePasswordScreen
  },
  {
    headerMode: "none"
  }
);

export default AuthStack;
