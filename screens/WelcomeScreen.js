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

// import { H1 } from "../components/H1";
// import { T } from "../components/T";

// import BadgerIcon from "../assets/images/icon.png";

const StyledWrapper = styled(View)`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: lime;
  height: 500;
`;

type Props = { navigation: { navigate: Function } };
type State = { password: string };

const unlockWallet = () => console.log("unlock");

class WelcomeScreen extends React.Component<Props, State> {
  render() {
    // debugger;
    const { navigation } = this.props;
    console.log("here?!");
    return (
      <StyledWrapper>
        <Text>Badger Wallet!!</Text>
        {/* <Image source={BadgerIcon} style={{ width: 200, height: 200 }} />
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
        /> */}
      </StyledWrapper>
    );
  }
}

export default WelcomeScreen;

// Badger is a secure identity vault for Bitcoin Cash.
// It allows you to hold bitcoin cash & tokens, and serves as your bridge to decentralized applications.
