// @flow
import React, { useState } from "react";
import styled from "styled-components";
import { SafeAreaView } from "react-native";

import QRCodeScanner from "react-native-qrcode-scanner";

import { T, H1, H2, Button, Spacer } from "../atoms";

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
      <Spacer />
      <H1 center>Create Transaction</H1>
      <Spacer />
      <T>Send To</T>
      {/* <QRCodeScanner
        onRead={() => console.log("read QR")}
        topContent={
          <T style={{color: 'white', flex: 1}}>
            Go to <T>wikipedia.org/wiki/QR_code</T> on your computer and scan
            the QR code.
          </T>
        }
        bottomContent={
            <T>OK. Got it!</T>
        }
      /> */}

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
