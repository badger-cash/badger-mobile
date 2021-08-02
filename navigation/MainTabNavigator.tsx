import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createCompatNavigatorFactory } from "@react-navigation/compat";
import { NavigationScreenProps } from "react-navigation";
import Ionicons from "react-native-vector-icons/Ionicons";

import HomeScreen from "../screens/HomeScreen";
import MenuScreen from "../screens/MenuScreen";
import ViewSeedScreen from "../screens/ViewSeedScreen";
import WalletDetailScreen from "../screens/WalletDetailScreen";
import ReceiveScreen from "../screens/ReceiveScreen";
import LogoutScreen from "../screens/LogoutScreen";
import ContactUsScreen from "../screens/ContactUsScreen";
import SelectCurrencyScreen from "../screens/SelectCurrencyScreen";
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

// import SendStack from "./SendStack";

import { spaceBadger as theme } from "../themes/spaceBadger";

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
        options={{ title: "Request" }}
      />
    </Stack.Navigator>
  );
};

const HomeStackOld = createCompatNavigatorFactory(createStackNavigator)(
  {
    WalletDashboard: {
      screen: HomeScreen
      // navigationOptions: {
      //   headerShown: false
      // }
    },
    WalletDetailScreen: {
      screen: WalletDetailScreen,
      navigationOptions: (props: NavigationScreenProps) => {
        const title = props.navigation?.state?.params?.symbol;
        return {
          title: `$${title}`
        };
      }
    },
    RequestSetup: {
      screen: RequestScreen,
      navigationOptions: {
        title: "Request"
      }
    }
  },
  {
    defaultNavigationOptions: props => {
      return {
        headerShown: false,
        tabBarLabel: "Wallets",
        headerBackTitleStyle: {
          color: theme.primary500
        },
        headerTintColor: theme.primary500,
        headerTitleStyle: {
          color: theme.fg100
        }
      };
    },
    headerLayoutPreset: "center"
  }
);

const MenuStackOld = createCompatNavigatorFactory(createStackNavigator)(
  {
    Menu: {
      screen: MenuScreen,
      navigationOptions: {
        title: "Menu"
      }
    },
    ViewSeedPhrase: {
      screen: ViewSeedScreen,
      navigationOptions: {
        title: "Seed Phrase"
      }
    },
    FAQScreen: {
      screen: FAQScreen,
      navigationOptions: {
        title: "F.A.Q."
      }
    },
    SweepScreen: {
      screen: KeySweepScreen,
      navigationOptions: {
        title: "Sweep"
      }
    },
    ContactUsScreen: {
      screen: ContactUsScreen,
      navigationOptions: {
        title: "Contact Us"
      }
    },
    LogoutScreen: {
      screen: LogoutScreen,
      navigationOptions: {
        title: "Logout?"
      }
    },
    SelectCurrencyScreen: {
      screen: SelectCurrencyScreen,
      navigationOptions: {
        title: "Select Currency"
      }
    }
  },
  {
    headerLayoutPreset: "center",
    defaultNavigationOptions: {
      headerBackTitleStyle: {
        color: theme.primary500
      },
      headerTintColor: theme.primary500,
      headerTitleStyle: {
        color: theme.fg100
      }
    },

    initialRouteName: "Menu"
  }
);

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
        options={{ title: "Menu" }}
      />
      <Stack.Screen
        name="ViewSeedPhrase"
        component={ViewSeedScreen}
        options={{ title: "View Seed" }}
      />
      <Stack.Screen
        name="FAQScreen"
        component={FAQScreen}
        options={{ title: "F.A.Q." }}
      />
      <Stack.Screen
        name="SweepScreen"
        component={KeySweepScreen}
        options={{ title: "Sweep" }}
      />
      <Stack.Screen
        name="ContactUsScreen"
        component={ContactUsScreen}
        options={{ title: "Contact Us" }}
      />
      <Stack.Screen
        name="LogoutScreen"
        component={LogoutScreen}
        options={{ title: "Logout?" }}
      />
      <Stack.Screen
        name="SelectCurrencyScreen"
        component={SelectCurrencyScreen}
        options={{ title: "Select Currency" }}
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
          title: "Receive",
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
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Receive" component={ReceiveStack} />
      <Tab.Screen name="Menu" component={MenuStack} />
    </Tab.Navigator>
  );
};

const BottomTabNavigatorOld = createCompatNavigatorFactory(
  createBottomTabNavigator
)(
  {
    Home: HomeStack,
    Receive: ReceiveStack,
    Menu: MenuStack
  },
  {
    defaultNavigationOptions: ({ navigation }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, horizontal, tintColor }) => {
        const { routeName } = navigation.state;

        // default icon
        let iconName = "ios-menu";

        if (routeName === "Home") {
          iconName = `ios-wallet`;
        } else if (routeName === "Menu") {
          iconName = `ios-menu`;
        } else if (routeName === "Receive") {
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
    }),
    tabBarOptions: {
      activeTintColor: theme.primary500,
      inactiveTintColor: theme.fg300,
      tabStyle: {
        paddingVertical: 5
      }
    }
  }
);

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
          title: "Setup Transaction"
        }}
      />
      <Stack.Screen
        name="SendConfirm"
        component={SendConfirmScreen}
        options={{
          title: "Confirm & Send"
        }}
      />
      <Stack.Screen
        name="Bip70Confirm"
        component={Bip70ConfirmScreen}
        options={{
          title: "Payment Request"
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

const MainAppStackOld = createCompatNavigatorFactory(createStackNavigator)(
  {
    MainAppTabs: BottomTabNavigator,
    SendStack,
    ViewPrivacyPolicy: {
      screen: ViewPrivacyNoticeScreen
    },
    ViewTermsOfUse: {
      screen: ViewTermsOfUseScreen
    }
  },
  {
    initialRouteName: "MainAppTabs",
    headerMode: "none"
  }
);
export default MainAppStack;
