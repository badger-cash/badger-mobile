// @flow

import React from "react";
import { Platform, View, Text } from "react-native";
import {
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";

const HomeStack = createStackNavigator({
  WalletDashboard: {
    screen: HomeScreen,
    navigationOptions: {
      header: null
      // tabBarLabel: "Home"
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

export default createBottomTabNavigator(
  {
    Home: HomeStack
    // ReceiveStack,
  },
  {
    navigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === "HomeStack") {
          iconName = `ios-information-circle${focused ? "" : "-outline"}`;
        } else if (routeName === "Settings") {
          iconName = `ios-options${focused ? "" : "-outline"}`;
        }

        // You can return any component that you like here! We usually use an
        // icon component from react-native-vector-icons
        return (
          <Ionicons
            name={iconName}
            size={horizontal ? 20 : 25}
            color={tintColor}
          />
        );
      }
    }),
    tabBarOptions: {
      activeTintColor: "tomato",
      inactiveTintColor: "gray"
    }
  }
);
