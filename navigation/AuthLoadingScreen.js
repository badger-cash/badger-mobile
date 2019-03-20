// @flow

import React from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
  Text
} from "react-native";

import AsyncStorage from "@react-native-community/async-storage";

type Props = {
  navigation: { navigate: Function }
};

class AuthLoadingScreen extends React.Component<Props> {
  constructor(props) {
    super(props);
    this._bootstrapAsync();
  }

  // Fetch the token from storage then navigate to our appropriate place
  _bootstrapAsync = async () => {
    const { navigation } = this.props;

    // Probably load and decrypt the private key with a password.
    // Then can add plausible deniability into decryption

    const userToken = await AsyncStorage.getItem("userToken");

    // This will switch to the App screen or Auth screen and this loading
    // screen will be unmounted and thrown away.

    // Figure this out
    // debugger;
    navigation.navigate(userToken ? "Main" : "AuthStack");
    // console.log(navigation)
  };

  // Render any loading content that you like here
  render() {
    return (
      <View>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}

export default AuthLoadingScreen;
