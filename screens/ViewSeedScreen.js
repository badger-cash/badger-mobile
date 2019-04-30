// @flow

import React, { useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { View, ScrollView, SafeAreaView } from "react-native";
import { NavigationEvents } from "react-navigation";

import { getMnemonicSelector } from "../data/accounts/selectors";
import { T, H1, Spacer, Button } from "../atoms";

const Screen = styled(ScrollView)`
  padding: 10px;
`;

const WordHolder = styled(View)`
  position: relative;
`;

const Cover = styled(View)`
  position: absolute;
  background-color: rgba(255, 255, 255, 0.95);
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  width: 100%;
  z-index: 1;
`;

type Props = { mnemonic: string };

const ViewSeedScreen = ({ mnemonic }: Props) => {
  const [showing, setShowing] = useState(false);

  const words = showing ? mnemonic : "---------- ".repeat(12).trim();
  const separated = words.split(" ");

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={() => {
          setShowing(false);
        }}
      />
      <Screen>
        <H1 center>Backup Seed Phrase</H1>
        <Spacer />
        <T center>
          Your seed phrase is the key to your funds. Please write it down, and
          keep it very, very private. This is your private key.
        </T>
        <Spacer />
        <WordHolder>
          {!showing && (
            <Cover>
              <T center>
                I am in a private area and wish to see my seed phrase
              </T>
              <Spacer />
              <Button
                text="Reveal Seed Phrase"
                onPress={() => setShowing(true)}
              />
            </Cover>
          )}
          {separated.map((word, idx) => (
            <T key={idx}>
              {idx + 1}. {word}
            </T>
          ))}
        </WordHolder>
        <Spacer />
      </Screen>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  mnemonic: getMnemonicSelector(state)
});

export default connect(mapStateToProps)(ViewSeedScreen);
