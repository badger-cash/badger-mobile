// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainTabNavigator from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

import SendStack from "./SendStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthStack,
      SendStack,
      AuthLoadingCheck: AuthLoadingScreen,
      Main: MainTabNavigator
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
