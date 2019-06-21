// @flow

import { createAppContainer, createSwitchNavigator } from "react-navigation";

import MainAppStack from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

// import SendStack from "./SendStack";

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthStack: { screen: AuthStack, path: "" },
      // SendStack: { screen: SendStack },
      AuthLoadingCheck: { screen: AuthLoadingScreen, path: ":paymentScheme" },
      Main: { screen: MainAppStack, path: "" }
    },
    {
      initialRouteName: "AuthLoadingCheck"
    }
  )
);
