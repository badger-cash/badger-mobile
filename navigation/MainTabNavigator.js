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
import ReceiveScreen from "../screens/ReceiveScreen";

const HomeStack = createStackNavigator(
  {
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
        const title = props.navigation.state.params.symbol;
        return {
          title: `$${title}`
        };
      }
    }
  },
  {
    navigationOptions: {
      tabBarLabel: "Wallets"
    }
  }
);

const ReceiveStack = createStackNavigator({
  Receive: { screen: ReceiveScreen, navigationOptions: { title: "Receive" } }
});

const SettingsStack = createStackNavigator(
  {
    SettingsList: {
      screen: SettingsScreen,
      navigationOptions: { title: "Settings" }
    },
    ViewSeedPhrase: { screen: ViewSeedScreen }
  },
  {
    initialRouteName: "SettingsList"
  }
);

const BottomTabNavigator = createBottomTabNavigator(
  {
    Home: HomeStack,
    Receive: ReceiveStack,
    Settings: SettingsStack
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
        } else if (routeName === "Receive") {
          iconName = "ios-download";
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
