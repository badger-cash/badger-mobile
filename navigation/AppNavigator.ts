import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createCompatNavigatorFactory } from "@react-navigation/compat";

import MainAppStack from "./MainTabNavigator";
import AuthLoadingScreen from "./AuthLoadingScreen";
import AuthStack from "./AuthStack";

export default createCompatNavigatorFactory(createStackNavigator)(
  {
    AuthLoadingCheck: {
      screen: AuthLoadingScreen,
      path: ":uri"
    },
    AuthStack: {
      screen: AuthStack
    },
    Main: {
      screen: MainAppStack,
      navigationOptions: {
        headerShown: false
      }
    }
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      headerShown: false
    }),
    initialRouteName: "AuthLoadingCheck"
  }
);
