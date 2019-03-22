// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";

import { SafeAreaView, ScrollView, View, TouchableOpacity } from "react-native";

import { T } from "../atoms";

import { logoutAccount } from "../data/accounts/actions";

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

const SettingsScreen = ({ navigation, logoutAccount }: Props) => {
  return (
    <SafeAreaView>
      <StyledScrollView>
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
            logoutAccount();
            navigation.navigate("AuthLoadingCheck");
          }}
        >
          <Row>
            <T>Logout</T>
          </Row>
        </TouchableOpacity>
      </StyledScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  return {};
};

const mapDispatchToProps = {
  logoutAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SettingsScreen);
