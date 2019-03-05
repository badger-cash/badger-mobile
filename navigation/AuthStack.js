// @flow

import React from "react";

import { createStackNavigator } from "react-navigation";

import WelcomeScreen from "../screens/WelcomeScreen";

const AuthStack = createStackNavigator({
  welcome: WelcomeScreen
});

export default AuthStack;
