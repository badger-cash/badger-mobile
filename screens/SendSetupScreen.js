// @flow
import React, { useState } from "react";
import styled from "styled-components";
import { SafeAreaView } from "react-native";

import { T, Button } from "../atoms";

type Props = {
  navigation: {
    navigate: Function,
    state?: { params: { symbol: string, tokenId: ?string } }
  }
};

const SendSetupScreen = ({ navigation }: Props) => {
  const [toAddress, setToAddress] = useState("");
  // Todo - Handle if send with nothing selected
  const { symbol, tokenId } = (navigation.state && navigation.state.params) || {
    symbol: null,
    tokenId: null
  };
  return (
    <SafeAreaView>
      <T>Send setup Screen</T>
      <T>
        {symbol} {tokenId}
      </T>
      <T />
      <Button
        onPress={() => navigation.navigate("SendConfirm")}
        text="To Confirm"
      />
    </SafeAreaView>
  );
};

export default SendSetupScreen;
