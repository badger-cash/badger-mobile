import React from "react";

import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import styled, { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import { View, LogBox } from "react-native";
LogBox.ignoreLogs(["Require cycle"]);
import { PersistGate } from "redux-persist/integration/react";

import AppNavigator from "./navigation/AppNavigator";
import { getStore } from "./data/store";
import { spaceBadger } from "./themes/spaceBadger";
import { StackFrame } from "react-native/Libraries/Core/Devtools/parseErrorStack";
import MainAppStack from "./navigation/MainTabNavigator";
import AuthLoadingScreen from "./navigation/AuthLoadingScreen";
// import AuthStack from "./navigation/AuthStack";
// Auth Screens
import WelcomeScreen from "./screens/WelcomeScreen";
import TermsOfUseScreen from "./screens/TermsOfUseScreen";
import PrivacyNoticeScreen from "./screens/PrivacyNoticeScreen";
import CreateWalletScreen from "./screens/CreateWalletScreen";

import RestoreWalletScreen from "./screens/RestoreWalletScreen";

const { store, persistor } = getStore();
const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AcceptTermsOfUse" component={TermsOfUseScreen} />
      <Stack.Screen name="PrivacyNotice" component={PrivacyNoticeScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
      <Stack.Screen name="RestoreFromBackup" component={RestoreWalletScreen} />
    </Stack.Navigator>
  );
};

const AppWrapper = styled(View)`
  flex: 1;
`;

const bchPrefix = "bitcoincash";
const slpPrefix = "simpleledger";

const App = () => {
  return (
    <NavigationContainer>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider theme={spaceBadger}>
            <AppWrapper>
              {/* <AppNavigator /> */}
              <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="AuthLoadingCheck"
                  component={AuthLoadingScreen}
                />
                <Stack.Screen name="AuthStack" component={AuthStack} />
                <Stack.Screen name="Main" component={MainAppStack} />
              </Stack.Navigator>
            </AppWrapper>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </NavigationContainer>
  );
};

export default App;
