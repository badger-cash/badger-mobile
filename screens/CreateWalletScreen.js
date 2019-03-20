// @flow

import React, { useEffect } from "react";
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  ActivityIndicator
} from "react-native";
import { connect } from "react-redux";

import { hasMnemonic } from "../data/accounts/selectors";

// Later - Add a way to add a password here for encryption instead of passing through.

type Props = {
  navigation: { navigate: Function },
  isCreated: boolean
};
const CreateWalletScreen = ({ navigation, isCreated }: Props) => {
  useEffect(() => {
    if (isCreated) {
      navigation.navigate("Home");
    }
  });
  return (
    <SafeAreaView>
      <ActivityIndicator />
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({ isCreated: hasMnemonic(state) });
const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateWalletScreen);
