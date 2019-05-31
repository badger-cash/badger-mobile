// @flow

import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";

import { SafeAreaView, View, ScrollView } from "react-native";

import { setFiatCurrency } from "../data/prices/actions";
import { currencySelector } from "../data/prices/selectors";
import { type CurrencyCode } from "../utils/currency-utils";

import { T, Spacer, Button } from "../atoms";

const ScreenWrapper = styled(View)`
  padding: 0 16px;
`;

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
    navigation.goBack();
  };

  return (
    <SafeAreaView>
      <ScreenWrapper>
        <ScrollView>
          <Spacer />
          <Button text="CAD" onPress={() => updateFiatCurrency("CAD")} />
          <Spacer />
          <Button text="USD" onPress={() => updateFiatCurrency("USD")} />
          <Spacer />
          <Button text="JPY" onPress={() => updateFiatCurrency("JPY")} />
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
