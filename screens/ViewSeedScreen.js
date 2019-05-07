// @flow

import React, { useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { View, ScrollView, SafeAreaView } from "react-native";
import { NavigationEvents } from "react-navigation";

import { viewSeed } from "../data/accounts/actions";
import {
  getMnemonicSelector,
  getAddressSelector
} from "../data/accounts/selectors";
import { T, Spacer, Button } from "../atoms";

const Screen = styled(ScrollView)`
  padding: 10px;
`;

const WordHolder = styled(View)`
  position: relative;
`;

const WordRow = styled(View)``;

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

type Props = { mnemonic: string, address: string, viewSeed: Function };

const ViewSeedScreen = ({ mnemonic, viewSeed, address }: Props) => {
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
        <Spacer />
        <T center>
          Your seed phrase is the key to your funds. Losing this phrase is
          losing access to this wallet. If lost we will be unable to help you
          recover it.
        </T>
        <Spacer small />
        <T center>
          Write it down, keep it safe, and do not share it with anyone you do
          not trust with access to your wallet
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
                onPress={() => {
                  setShowing(true);
                  viewSeed(address);
                }}
              />
            </Cover>
          )}
          <View>
            {separated.map((word, idx) => (
              <WordRow key={idx}>
                <T>
                  <T monospace type="muted">
                    {`${idx + 1}.`.padStart(3, " ")}
                  </T>
                  <T> {word}</T>
                </T>
                <Spacer tiny />
              </WordRow>
            ))}
          </View>
        </WordHolder>
        <Spacer />
      </Screen>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  address: getAddressSelector(state),
  mnemonic: getMnemonicSelector(state)
});

const mapDispatchToProps = { viewSeed };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ViewSeedScreen);
