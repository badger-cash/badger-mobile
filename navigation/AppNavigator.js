// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainAppStack from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthLoadingCheck: { screen: AuthLoadingScreen, path: ":uri" },
      AuthStack: { screen: AuthStack, path: "" },
      Main: { screen: MainAppStack, path: "" }
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
