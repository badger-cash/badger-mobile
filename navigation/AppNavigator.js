// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainAppStack from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthStack: { screen: AuthStack, path: "" },
      AuthLoadingCheck: { screen: AuthLoadingScreen, path: ":uri" },
      Main: { screen: MainAppStack, path: "" }
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
