// @flow

import React from "react";
import { Platform, View, Text } from "react-native";
import {
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";

import HomeScreen from "../screens/HomeScreen";

const HomeStack = createStackNavigator({
  walletDashboard: {
    screen: HomeScreen,
    navigationOptions: {
      header: null,
      tabBarLabel: "Home"
      // tabBarIcon: ({ focused }) => (
      //   <View>
      //     <Text>Hello.</Text>
      //   </View>
      // )
    },
    tabBarOptions: {
      activeTintColor: "tomato",
      inactiveTintColor: "gray"
    }
  }
});

export default createBottomTabNavigator({
  HomeStack
  // ReceiveStack,
});
