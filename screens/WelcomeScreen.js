// @flow

import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  Button,
  TextInput
} from "react-native";
import styled from "styled-components";

import { H1 } from "../components/H1";
import { T } from "../components/T";

import BadgerIcon from "../assets/images/icon.png";

const StyledWrapper = styled(SafeAreaView)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 125;
`;

type Props = { navigation: { navigate: Function } };
type State = { password: string };

const unlockWallet = () => console.log("unlock");

class WelcomeScreen extends React.Component<Props, State> {
  render() {
    const { navigation } = this.props;
    return (
      <StyledWrapper>
        <H1>Badger Wallet</H1>
        <Image source={BadgerIcon} style={{ width: 200, height: 200 }} />
        <T>
          Badger is a secure identity vault for Bitcoin Cash. It allows you to
          hold bitcoin cash & tokens, and serves as your bridge to decentralized
          applications.
        </T>

        <Button
          onPress={() => navigation.navigate("createPassword")}
          title="Create"
        />
        <Button
          onPress={() => navigation.navigate("restore")}
          title="Restore"
        />
      </StyledWrapper>
    );
  }
}

export default WelcomeScreen;

// Badger is a secure identity vault for Bitcoin Cash.
// It allows you to hold bitcoin cash & tokens, and serves as your bridge to decentralized applications.
