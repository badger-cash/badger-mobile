// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";

import { ActivityIndicator, StatusBar, View } from "react-native";
import { hasMnemonicSelector } from "../data/accounts/selectors";

type Props = {
  navigation: { navigate: Function },
  hasMnemonic: boolean
};

const AuthLoadingScreen = ({ navigation, hasMnemonic }: Props) => {
  useEffect(() => {
    const targetScreen = hasMnemonic ? "Main" : "AuthStack";
    navigation.navigate(targetScreen);
  });

  return (
    <View>
      <ActivityIndicator />
      <StatusBar barStyle="default" />
    </View>
  );
};

const mapStateToProps = state => ({ hasMnemonic: hasMnemonicSelector(state) });

export default connect(mapStateToProps)(AuthLoadingScreen);
