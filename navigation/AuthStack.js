// @flow

import React from "react";

import { createSwitchNavigator, createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";
// import TermsOfUseScreen from "../screens/TermsOfUseScreen";
// import PrivacyNoticeScreen from "../screens/PrivacyNoticeScreen";
// import CreatePasswordScreen from "../screens/CreatePasswordScreen";

// import UnlockScreen from "../screens/UnlockScreen";
// import RestoreWalletScreen from "../screens/RestoreWalletScreen";

const AuthStack = createStackNavigator(
  {
    welcome: {
      screen: WelcomeScreen,
      navigationOptions: ({ navigation }) => ({
        title: `TEST Profile'`
      })
    }
    // termsOfUse: TermsOfUseScreen,
    // privacyNotice: PrivacyNoticeScreen,
    // unlock: UnlockScreen,
    // restore: RestoreWalletScreen,
    // createPassword: CreatePasswordScreen
  },
  {
    headerMode: "screen"
    // initialRouteName: "welcome"
  }
);

export default AuthStack;
