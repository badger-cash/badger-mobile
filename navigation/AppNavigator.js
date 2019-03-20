// @flow

import React from "react";
import {
  createAppContainer,
  createSwitchNavigator,
  createStackNavigator
} from "react-navigation";

import MainTabNavigator from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";
// import TermsOfUseScreen from "../screens/TermsOfUseScreen";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthLoadingCheck: AuthLoadingScreen,
      Main: MainTabNavigator,
      AuthStack: AuthStack
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
