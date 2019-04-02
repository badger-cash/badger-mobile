// @flow

import React from "react";
import {
  createStackNavigator,
  createBottomTabNavigator
} from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ViewSeedScreen from "../screens/ViewSeedScreen";
import WalletDetailScreen from "../screens/WalletDetailScreen";

const HomeStack = createStackNavigator({
  WalletDashboard: {
    screen: HomeScreen,
    navigationOptions: {
      header: null,
      tabBarLabel: "Wallets"
    }
  },
  WalletDetailScreen: {
    screen: WalletDetailScreen,
    navigationOptions: props => {
      console.log("screen params?");
      console.log(props);
      return {
        title: `$${props.navigation.state.params.symbol}`
      };
    }
  }
});

const SettingsStack = createStackNavigator(
  {
    SettingsList: SettingsScreen,
    ViewSeedPhrase: ViewSeedScreen
  },
  {
    initialRouteName: "SettingsList"
  }
);

const BottomTabNavigator = createBottomTabNavigator(
  {
    Home: HomeStack,
    Settings: SettingsStack
    //Receive:  ReceiveStack,
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;
        let iconName;
        if (routeName === "Home") {
          iconName = `ios-cash`; //${focused ? "" : "-outline"}`;
        } else if (routeName === "Settings") {
          iconName = `ios-cog`; //${focused ? "" : "-outline"}`;
        }

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
      activeTintColor: "#F59332",
      inactiveTintColor: "#4D4D4D"
    }
  }
);

export default BottomTabNavigator;
