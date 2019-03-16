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
// import { TextInput } from "react-native-gesture-handler";

const StyledWrapper = styled(SafeAreaView)`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 125;
`;

type Props = {};
type State = { password: string };

const unlockWallet = () => console.log("unlock");

class UnlockScreen extends React.Component<Props, State> {
  state = {
    password: null
  };

  render() {
    return (
      <StyledWrapper>
        <H1>Badger Wallet</H1>
        <Image source={BadgerIcon} style={{ width: 200, height: 200 }} />
        <T>The decentralized web awaits</T>

        <TextInput
          style={{
            height: 40,
            width: "75%",
            borderColor: "gray",
            borderWidth: 1
          }}
          secureTextEntry={true}
          autoComplete="password"
          onChangeText={text => this.setState({ password: text })}
          value={this.state.password}
          placeholder="password"
        />
        <Button onPress={unlockWallet} title="Unlock" />
      </StyledWrapper>
    );
  }
}

export default UnlockScreen;
