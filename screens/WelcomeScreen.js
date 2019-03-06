// @flow

import React from "react";

import styled from "styled-components";

import { SafeAreaView, View, Text, Image } from "react-native";

import BadgerIcon from "../assets/images/icon.png";

// import

// const WelcomeScr

const WelcomeScreen = props => (
  <SafeAreaView>
    <Image source={BadgerIcon} />
    <Text>Welcome Screen</Text>
  </SafeAreaView>
);

export default WelcomeScreen;
