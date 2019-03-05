// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";

const AuthStack = createStackNavigator(
  {
    welcome: WelcomeScreen
  },
  {
    headerMode: "none"
  }
);

export default AuthStack;
