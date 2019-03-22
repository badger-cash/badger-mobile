// @flow

import React from "react";
import styled from "styled-components";

import {
  SafeAreaView,
  ScrollView,
  View,
  FlatList,
  TouchableOpacity
} from "react-native";
import { T } from "../atoms";

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
  navigation: { navigate: Function }
};

const SettingsScreen = ({ navigation }: Props) => {
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
            // call redux logout function
            // then navigate to base of app
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

export default SettingsScreen;
