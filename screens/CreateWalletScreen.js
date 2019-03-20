// @flow

import React, { useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  ActivityIndicator
} from "react-native";

// Later - Add a way to add a password here for encryption instead of passing through.

const CreateWalletScreen = ({ navigation }) => {
  useEffect(() => {
    navigation.navigate("walletDashboard");
  });
  return (
    <SafeAreaView>
      <ActivityIndicator />
    </SafeAreaView>
  );
};

// On load - Call a redux action to generate the new wallet, and save the wallet in the redux store.
// Then redirect the page to the MainTabNavigator

export default CreateWalletScreen;
