// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { SafeAreaView, ScrollView, View, TouchableOpacity } from "react-native";

import { getSeedViewedSelector } from "../data/accounts/selectors";

import { T, Spacer } from "../atoms";

import packageJson from "../package.json";

const StyledScrollView = styled(ScrollView)`
  height: 100%;
`;

const Row = styled(View)`
  height: 65;
  flex-direction: row;
  align-items: center;
  border: solid ${props => props.theme.fg500};
  border-top-width: 0;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: 0.5px;
  padding-left: 5;
`;

const NotificationDot = styled(View)`
  height: 6px;
  width: 6px;
  border-radius: 6px;
  background-color: ${props => props.theme.accent500};
  margin-left: 7px;
`;

const OptionsRow = ({
  text,
  pressFn,
  hasNotification,
  muted
}: {
  text: string,
  pressFn: Function,
  hasNotification?: boolean,
  muted?: boolean
}) => (
  <TouchableOpacity onPress={pressFn}>
    <Row>
      <T type={muted ? "muted2" : ""}>{text}</T>
      {hasNotification && <NotificationDot />}
    </Row>
  </TouchableOpacity>
);

type Props = {
  navigation: { navigate: Function },
  seedViewed: boolean
};

const SettingsScreen = ({ navigation, seedViewed }: Props) => {
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
          Version {packageJson.version}
        </T>
        <Spacer small />
      </StyledScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const seedViewed = getSeedViewedSelector(state);
  return { seedViewed };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsScreen);
