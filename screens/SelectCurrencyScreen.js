// @flow

import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";

import { SafeAreaView, View, ScrollView } from "react-native";

import { T, Spacer, Button } from "../atoms";

const ScreenWrapper = styled(View)`
  padding: 0 16px;
`;

type Props = {
  setCurrency: Function
};

const SelectCurrencyScreen = ({ setCurrency }: Props) => {
  return (
    <SafeAreaView>
      <ScreenWrapper>
        <T>Select Currency Screen</T>
        <ScrollView>
          <Spacer />
          <Button text="CAD" onPress={() => setCurrency("CAD")} />
          <Spacer />
          <Button text="USD" onPress={() => setCurrency("USD")} />
          <Spacer />
          <Button text="JPY" onPress={() => setCurrency("JPY")} />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return { setCurrency: currency => console.log("selected", currency) };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SelectCurrencyScreen);
