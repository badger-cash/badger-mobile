// @flow

import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import { setFiatCurrency } from "../data/prices/actions";
import { currencySelector } from "../data/prices/selectors";
import {
  type CurrencyCode,
  currencyOptions,
  currencySymbolMap,
  currencyNameMap
} from "../utils/currency-utils";

import { T, H2, Spacer, Button } from "../atoms";

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

const CurrencyRow = ({ text, onPress, isActive }) => (
  <RowContainer onPress={onPress}>
    <Spacer small />
    <RowTextContainer>
      <T type={isActive ? "primary" : null}>{text}</T>
      {isActive && (
        <T type="primary">
          <Ionicons name="ios-checkmark-circle" size={18} />
        </T>
      )}
    </RowTextContainer>
    <Spacer small />
  </RowContainer>
);

type Props = {
  currencyActive: CurrencyCode,
  setFiatCurrency: Function,
  navigation: { navigate: Function, goBack: Function }
};

const SelectCurrencyScreen = ({
  navigation,
  currencyActive,
  setFiatCurrency
}: Props) => {
  const updateFiatCurrency = (code: CurrencyCode) => {
    setFiatCurrency(code);
  };

  return (
    <SafeAreaView>
      <ScreenWrapper>
        <ActiveSection>
          <Spacer />
          <T center>Active Currency:</T>
          <Spacer tiny />
          <T center weight="bold">
            {`${currencySymbolMap[currencyActive]} ${currencyActive} - ${
              currencyNameMap[currencyActive]
            } `}
          </T>
          <Spacer />
        </ActiveSection>
        <ScrollView>
          {currencyOptions.map((currencyCode: CurrencyCode) => {
            return (
              <CurrencyRow
                key={currencyCode}
                text={`${currencyCode} - ${currencyNameMap[currencyCode]}`}
                onPress={() => updateFiatCurrency(currencyCode)}
                isActive={currencyActive === currencyCode}
              />
            );
          })}
          <Spacer />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return { currencyActive: currencySelector(state) };
};

const mapDispatchToProps = { setFiatCurrency };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectCurrencyScreen);
