// @flow

import React from "react";
import { Platform, View, Text } from "react-native";
import {
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";

// import TabBarIcon from "../components/TabBarIcon";
import HomeScreen from "../screens/HomeScreen";

const HomeStack = createStackNavigator({
  Home: HomeScreen
});

HomeStack.navigationOptions = {
  tabBarLabel: "Home",
  tabBarIcon: ({ focused }) => (
    <View>
      <Text>Hello.</Text>
    </View>
  )
};

export default createBottomTabNavigator({
  HomeStack
});
