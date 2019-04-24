// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainAppStack from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

// import SendStack from "./SendStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthStack,
      // SendStack: { screen: SendStack },
      AuthLoadingCheck: AuthLoadingScreen,
      Main: MainAppStack
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
