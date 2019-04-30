// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { SafeAreaView, ScrollView, View, TouchableOpacity } from "react-native";

import { T, Spacer } from "../atoms";

import packageJson from "../package.json";

const StyledScrollView = styled(ScrollView)`
  height: 100%;
`;

const Row = styled(View)`
  height: 65;
  justify-content: center;
  border: solid ${props => props.theme.fg200};
  border-top-width: 0;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: 0.5px;
  padding-left: 5;
`;

type Props = {
  navigation: { navigate: Function },
  logoutAccount: Function
};

const SettingsScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView>
      <StyledScrollView contentContainerStyle={{ flex: 1 }}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ViewSeedPhrase");
          }}
        >
          <Row>
            <T>View Seed Phrase</T>
          </Row>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ViewTermsOfUse");
          }}
        >
          <Row>
            <T>Terms of Use</T>
          </Row>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("ViewPrivacyPolicy");
          }}
        >
          <Row>
            <T>Privacy Policy</T>
          </Row>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("LogoutScreen");
          }}
        >
          <Row>
            <T>Logout</T>
          </Row>
        </TouchableOpacity>
        <Spacer fill />
        <T center size="small" type="muted2">
          Version {packageJson.version}
        </T>
        <Spacer small />
      </StyledScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsScreen);
