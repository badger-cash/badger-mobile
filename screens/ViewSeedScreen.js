// @flow

import React from "react";
import { connect } from "react-redux";

import { Text, SafeAreaView } from "react-native";

import { getMnemonicSelector } from "../data/accounts/selectors";
import { T } from "../atoms";

type Props = { mnemonic: string };

const ViewSeedScreen = ({ mnemonic }: Props) => {
  return (
    <SafeAreaView>
      <Text>Backup Seed Phrase here</Text>
      <T>{mnemonic}</T>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  mnemonic: getMnemonicSelector(state)
});

export default connect(mapStateToProps)(ViewSeedScreen);
