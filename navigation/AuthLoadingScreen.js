// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";

import { ActivityIndicator, StatusBar, View } from "react-native";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";

type Props = {
  navigation: { navigate: Function },
  mnemonic: string,
  getAccount: Function
};

const AuthLoadingScreen = ({ navigation, mnemonic, getAccount }: Props) => {
  useEffect(() => {
    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);
      navigation.navigate("Main");
    } else {
      navigation.navigate("AuthStack");
    }
  });

  return (
    <View>
      <ActivityIndicator />
      <StatusBar barStyle="default" />
    </View>
  );
};

const mapStateToProps = state => ({ mnemonic: getMnemonicSelector(state) });
const mapDispatchToProps = {
  getAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLoadingScreen);
