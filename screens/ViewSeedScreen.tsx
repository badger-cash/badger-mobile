import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";

import { View, ScrollView, SafeAreaView } from "react-native";
import { NavigationEvents, NavigationScreenProps } from "react-navigation";

import { viewSeed } from "../data/accounts/actions";
import {
  getMnemonicSelector,
  getAddressSelector
} from "../data/accounts/selectors";
import { T, Spacer, Button } from "../atoms";
import { FullState } from "../data/store";

import lang from "../_locales/index";
var tran = new lang("ViewSeedScreen");

const Screen = styled(ScrollView)`
  padding: 0 16px;
`;

const WordHolder = styled(View)`
  position: relative;
`;

const WordRow = styled(View)``;

const Cover = styled(View)`
  position: absolute;
  background-color: ${props => props.theme.coverBg};
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

type PropsFromParent = NavigationScreenProps & {};

const mapStateToProps = (state: FullState) => ({
  address: getAddressSelector(state),
  mnemonic: getMnemonicSelector(state)
});

const mapDispatchToProps = {
  viewSeed
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

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
        <T center>{tran.getStr("Text_This_seed_phrase")}</T>
        <Spacer small />
        <T center>{tran.getStr("Text_losing_this")}</T>
        <Spacer small />
        <T center>{tran.getStr("Text_Write_the_12-word")}</T>
        <Spacer />
        <WordHolder>
          {!showing && (
            <Cover>
              <T center>{tran.getStr("Text_I_am_in")}</T>
              <Spacer />
              <Button
                text={tran.getStr("Btn_Reveal_Seed")}
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
                  <T monospace type="muted2">
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

export default connect(mapStateToProps, mapDispatchToProps)(ViewSeedScreen);
