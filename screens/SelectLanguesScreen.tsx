import React, { useState } from "react";
import styled from "styled-components";
import { connect, ConnectedProps } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NavigationScreenProps } from "react-navigation";
import AsyncStorage from "@react-native-community/async-storage";

import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import { T, Spacer } from "../atoms";

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

const SelectLanguesScreen = ({ navigation }: Props) => {
  var [currencyActive, setCurrencyActive] = useState();
  const storeData = async (value: string) => {
    try {
      value = JSON.stringify(value);
      await AsyncStorage.setItem("@lang", value);
    } catch (e) {
      // saving error
    }
  };

  const getData = async () => {
    try {
      const value = await AsyncStorage.getItem("@lang");
      // value previously stored
      // console.log(value.toString());
      value = JSON.parse(value);
      setCurrencyActive(value.name);
    } catch (e) {
      // error reading value
    }
  };

  getData();

  return (
    <SafeAreaView>
      <ScreenWrapper>
        <ActiveSection>
          <Spacer />
          <T center>Active Langues:</T>
          <Spacer tiny />
          <T center weight="bold">
            {` ${(getData(), currencyActive)} `}
          </T>
          <Spacer />
        </ActiveSection>
        <ScrollView>
          {Langs.map(currencyCode => {
            return (
              <CurrencyRow
                key={currencyCode}
                text={`${currencyCode.name}`}
                onPress={() => {
                  setCurrencyActive(currencyCode.name);
                  storeData(currencyCode);
                }}
                isActive={currencyActive === currencyCode.code}
              />
            );
          })}
          <Spacer />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default connector(SelectLanguesScreen);
