// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
  SafeAreaView,
  ScrollView,
  View,
  TouchableOpacity,
  StyleSheet
} from "react-native";

import { getSeedViewedSelector } from "../data/accounts/selectors";

import { currencySymbolMap, type CurrencyCode } from "../utils/currency-utils";
import { currencySelector } from "../data/prices/selectors";

import { T, Spacer } from "../atoms";

// import packageJson from "../package.json";

const StyledScrollView = styled(ScrollView)`
  height: 100%;
`;

const Row = styled(View)`
  height: 65;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border: solid ${props => props.theme.fg500};
  border-top-width: 0;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: ${StyleSheet.hairlineWidth};
  padding: 0 16px;
`;

const NotificationDot = styled(View)`
  height: 6px;
  width: 6px;
  border-radius: 6px;
  background-color: ${props => props.theme.accent500};
  margin-left: 8px;
`;

const LeftContent = styled(View)`
  flex-direction: row;
  align-items: center;
`;
const RightContent = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const OptionsRow = ({
  hasNotification,
  label,
  muted,
  pressFn,
  text
}: {
  hasNotification?: boolean,
  label?: string,
  muted?: boolean,
  pressFn: Function,
  text: string
}) => (
  <TouchableOpacity onPress={pressFn}>
    <Row>
      <LeftContent>
        <T type={muted ? "muted2" : ""}>{text}</T>
        {hasNotification && <NotificationDot />}
      </LeftContent>
      {label && (
        <RightContent>
          <T type="muted2" style={{ marginRight: 8 }}>
            {label}
          </T>
          <T type="muted2">
            <Ionicons name="ios-arrow-forward" size={20} />
          </T>
        </RightContent>
      )}
    </Row>
  </TouchableOpacity>
);

type Props = {
  navigation: { navigate: Function },
  seedViewed: boolean,
  fiatCurrency: CurrencyCode
};

const MenuScreen = ({ navigation, seedViewed, fiatCurrency }: Props) => {
  return (
    <SafeAreaView>
      <StyledScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <OptionsRow
          text="View Seed Phrase"
          pressFn={() => {
            navigation.navigate("ViewSeedPhrase");
          }}
          hasNotification={!seedViewed}
        />
        <OptionsRow
          text="Currency"
          pressFn={() => {
            navigation.navigate("SelectCurrencyScreen");
          }}
          label={`${currencySymbolMap[fiatCurrency]} ${fiatCurrency}`}
        />
        <OptionsRow
          text="Frequently Asked Questions - FAQ"
          pressFn={() => {
            navigation.navigate("FAQScreen");
          }}
        />
        <OptionsRow
          text="Paper Wallet Sweep"
          pressFn={() => {
            navigation.navigate("SweepScreen");
          }}
        />
        <OptionsRow
          text="Terms of Use"
          muted
          pressFn={() => {
            navigation.navigate("ViewTermsOfUse");
          }}
        />
        <OptionsRow
          text="Privacy Policy"
          muted
          pressFn={() => {
            navigation.navigate("ViewPrivacyPolicy");
          }}
        />
        <OptionsRow
          text="Contact Us"
          muted
          pressFn={() => {
            navigation.navigate("ContactUsScreen");
          }}
        />
        <OptionsRow
          text="Logout"
          pressFn={() => {
            navigation.navigate("LogoutScreen");
          }}
        />
        <Spacer fill />
        <Spacer small />
        <T center size="small" type="muted2">
          {/* Version {packageJson.version} */}
          Version 0.12.5
        </T>
        <Spacer small />
      </StyledScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const seedViewed = getSeedViewedSelector(state);
  const fiatCurrency = currencySelector(state);
  return { seedViewed, fiatCurrency };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MenuScreen);
