import React from "react";
import styled from "styled-components";
import { connect, ConnectedProps } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NavigationScreenProps } from "react-navigation";

import {
  SafeAreaView,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity
} from "react-native";

import { FullState } from "../data/store";
import { setFiatCurrency } from "../data/prices/actions";
import { currencySelector } from "../data/prices/selectors";
import {
  CurrencyCode,
  currencyOptions,
  currencySymbolMap,
  currencyNameMap
} from "../utils/currency-utils";

import { T, Spacer } from "../atoms";

import lang from "../_locales/index";
var tran = new lang("SelectCurrencyScreen");

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

const mapStateToProps = (state: FullState) => {
  return {
    currencyActive: currencySelector(state)
  };
};

const mapDispatchToProps = {
  setFiatCurrency
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

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
          <T center>{tran.getStr("Active_Currency")} :</T>
          <Spacer tiny />
          <T center weight="bold">
            {`${currencySymbolMap[currencyActive]} ${currencyActive} - ${currencyNameMap[currencyActive]} `}
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

export default connector(SelectCurrencyScreen);
