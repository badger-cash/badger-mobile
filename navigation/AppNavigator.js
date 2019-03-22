// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainTabNavigator from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthStack,
      AuthLoadingCheck: AuthLoadingScreen,
      Main: MainTabNavigator
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
