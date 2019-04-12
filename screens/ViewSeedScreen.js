// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { Text, View, SafeAreaView } from "react-native";

import { getMnemonicSelector } from "../data/accounts/selectors";
import { T, H1, Spacer } from "../atoms";

const Screen = styled(View)`
  padding: 10px;
`;

// TODO - Currently stays on this screen if navigating away using bottom nav.
// Make pressing settings always start on index page

type Props = { mnemonic: string };

const ViewSeedScreen = ({ mnemonic }: Props) => {
  const separated = mnemonic.split(" ");

  return (
    <SafeAreaView>
      <Screen>
        <H1>Backup Seed Phrase</H1>
        <T>
          Your seed phrase is the key to your funds. Please write it down, and
          keep it very, very private. This is your private key.
        </T>
        <Spacer medium />
        {separated.map((word, idx) => (
          <T key={idx}>
            {idx + 1}. {word}
          </T>
        ))}
      </Screen>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  mnemonic: getMnemonicSelector(state)
});

export default connect(mapStateToProps)(ViewSeedScreen);
