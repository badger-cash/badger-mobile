import React, { useState } from "react";
import styled from "styled-components";
import { connect, ConnectedProps } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NavigationScreenProps } from "react-navigation";

import { getLang, setLang } from "../data/languages/index";

import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import { T, Spacer } from "../atoms";

import lang from "../_locales/index";
var tran = new lang("SelectLanguagesScreen");

const ScreenWrapper = styled(View)`
  height: 100%;
`;

const ActiveSection = styled(View)`
  padding: 0 16px;
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-color: ${props => props.theme.fg500};
`;

const RowContainer = styled(TouchableOpacity)`
  padding: 0 16px;
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-color: ${props => props.theme.fg500};
`;
const RowTextContainer = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

type PropsCurrencyRow = {
  text: string;
  onPress(): void;
  isActive: boolean;
};

const CurrencyRow = ({ text, onPress, isActive }: PropsCurrencyRow) => (
  <RowContainer onPress={onPress}>
    <Spacer small />
    <RowTextContainer>
      <T type={isActive ? "primary" : undefined}>{text}</T>
      {isActive && (
        <T type="primary">
          <Ionicons name="ios-checkmark-circle" size={18} />
        </T>
      )}
    </RowTextContainer>
    <Spacer small />
  </RowContainer>
);

type PropsFromParent = NavigationScreenProps & {};

const connector = connect();

type Props = PropsFromParent;

const Langs = require("../_locales/index.json");

const SelectLanguagesScreen = ({ navigation }: Props) => {
  var [languageActive, setLanguageActive] = useState();

  getLang(setLanguageActive);

  return (
    <SafeAreaView>
      <ScreenWrapper>
        <ActiveSection>
          <Spacer />
          <T center>{tran.getStr("Active_Languages")} :</T>
          <Spacer tiny />
          <T center weight="bold">
            {` ${(getLang(setLanguageActive), languageActive)} `}
          </T>
          <Spacer />
        </ActiveSection>
        <ScrollView>
          {Langs.map((lang: any) => {
            return (
              <CurrencyRow
                key={lang}
                text={`${lang.name}`}
                onPress={() => {
                  setLanguageActive(lang.name);
                  setLang(lang);
                }}
                isActive={languageActive === lang.name}
              />
            );
          })}
          <Spacer />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default connector(SelectLanguagesScreen);
