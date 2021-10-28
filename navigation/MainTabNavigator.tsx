import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import MenuScreen from "../screens/MenuScreen";
import ViewSeedScreen from "../screens/ViewSeedScreen";
import WalletDetailScreen from "../screens/WalletDetailScreen";
import ReceiveScreen from "../screens/ReceiveScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import SelectCurrencyScreen from "../screens/SelectCurrencyScreen";
import SelectLanguagesScreen from "../screens/SelectLanguagesScreen";
import RequestScreen from "../screens/RequestScreen";
import FAQScreen from "../screens/FAQScreen";
import KeySweepScreen from "../screens/KeySweepScreen";

//SendStack
import SendSetupScreen from "../screens/SendSetupScreen";
import SendConfirmScreen from "../screens/SendConfirmScreen";
import SendSuccessScreen from "../screens/SendSuccessScreen";
import Bip70ConfirmScreen from "../screens/Bip70ConfirmScreen";
import Bip70SuccessScreen from "../screens/Bip70SuccessScreen";

import { ViewTermsOfUseScreen } from "../screens/TermsOfUseScreen";
import { ViewPrivacyNoticeScreen } from "../screens/PrivacyNoticeScreen";

import { spaceBadger as theme } from "../themes/spaceBadger";

import lang from "../_locales/index";
let tran = new lang("MainTabNavigator");

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: "center",
        headerBackTitleStyle: {
          color: theme.primary500
        },
        headerTintColor: theme.primary500,
        headerTitleStyle: {
          color: theme.fg100
        }
      }}
    >
      <Stack.Screen
        name="WalletDashboard"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WalletDetailScreen"
        component={WalletDetailScreen}
        options={({ route }) => ({
          title: `$${route.params?.symbol}`
        })}
      />
      <Stack.Screen
        name="RequestSetup"
        component={RequestScreen}
        options={{ title: tran.getStr("Request") }}
      />
    </Stack.Navigator>
  );
};

const MenuStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerBackTitleStyle: {
          color: theme.primary500
        },
        headerTintColor: theme.primary500,
        headerTitleStyle: {
          color: theme.fg100
        }
      }}
    >
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: tran.getStr("Menu") }}
      />
      <Stack.Screen
        name="ViewSeedPhrase"
        component={ViewSeedScreen}
        options={{ title: tran.getStr("View_Seed") }}
      />
      <Stack.Screen
        name="FAQScreen"
        component={FAQScreen}
        options={{ title: tran.getStr("F.A.Q.") }}
      />
      <Stack.Screen
        name="SweepScreen"
        component={KeySweepScreen}
        options={{ title: tran.getStr("Sweep") }}
      />
      <Stack.Screen
        name="ContactUsScreen"
        component={ContactUsScreen}
        options={{ title: tran.getStr("Contact_Us") }}
      />
      <Stack.Screen
        name="LogoutScreen"
        component={LogoutScreen}
        options={{ title: tran.getStr("Logout?") }}
      />
      <Stack.Screen
        name="SelectCurrencyScreen"
        component={SelectCurrencyScreen}
        options={{ title: tran.getStr("Select_Currency") }}
      />
      <Stack.Screen
        name="SelectLanguagesScreen"
        component={SelectLanguagesScreen}
        options={{ title: tran.getStr("Select_Languages") }}
      />
    </Stack.Navigator>
  );
};

const ReceiveStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Receive"
        component={ReceiveScreen}
        options={{
          title: tran.getStr("Receive"),
          headerShown: true,
          headerTitleAlign: "center"
        }}
      />
    </Stack.Navigator>
  );
};

const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, horizontal, tintColor }) => {
          // default icon
          let iconName = "ios-menu";

          if (route.name === "Home") {
            iconName = `ios-wallet`;
          } else if (route.name === "Menu") {
            iconName = `ios-menu`;
          } else if (route.name === "Receive") {
            iconName = "ios-download";
          }

          return (
            <Ionicons
              name={iconName}
              size={horizontal ? 20 : 25}
              color={tintColor ? tintColor : undefined}
            />
          );
        }
      })}
      tabBarOptions={{
        activeTintColor: theme.primary500,
        inactiveTintColor: theme.fg300,
        tabStyle: {
          paddingVertical: 5
        }
      }}
    >
      <Tab.Screen
        name={tran.getStr("BottomTabNavigator_Home")}
        component={HomeStack}
      />
      <Tab.Screen
        name={tran.getStr("BottomTabNavigator_Receive")}
        component={ReceiveStack}
      />
      <Tab.Screen
        name={tran.getStr("BottomTabNavigator_Menu")}
        component={MenuStack}
      />
    </Tab.Navigator>
  );
};

const SendStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerBackTitleStyle: {
          color: theme.primary500
        },
        headerTintColor: theme.primary500,
        headerTitleStyle: {
          color: theme.fg100
        }
      }}
    >
      <Stack.Screen
        name="SendSetup"
        component={SendSetupScreen}
        options={{
          title: tran.getStr("Setup_Transaction")
        }}
      />
      <Stack.Screen
        name="SendConfirm"
        component={SendConfirmScreen}
        options={{
          title: tran.getStr("Confirm_and_Send")
        }}
      />
      <Stack.Screen
        name="Bip70Confirm"
        component={Bip70ConfirmScreen}
        options={{
          title: tran.getStr("Payment_Request")
        }}
      />
      <Stack.Screen
        name="Bip70Success"
        component={Bip70SuccessScreen}
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen
        name="SendSuccess"
        component={SendSuccessScreen}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  );
};

const MainAppStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainAppTabs" component={BottomTabNavigator} />
      <Stack.Screen name="SendStack" component={SendStack} />
      <Stack.Screen
        name="ViewPrivacyPolicy"
        component={ViewPrivacyNoticeScreen}
      />
      <Stack.Screen name="ViewTermsOfUse" component={ViewTermsOfUseScreen} />
    </Stack.Navigator>
  );
};

export default MainAppStack;
