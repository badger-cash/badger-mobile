// @flow
import React, { useState } from "react";
import styled from "styled-components";
import {
  SafeAreaView,
  TextInput,
  View,
  Clipboard,
  Dimensions
} from "react-native";

import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T, H1, H2, Button, Spacer } from "../atoms";

const StyledTextInput = styled(TextInput)`
  border: 1px ${props => props.theme.primary500};
  padding: 15px 5px;
`;

const ScreenWrapper = styled(SafeAreaView)`
  position: relative;
  margin: 0 6px;
`;

const StyledButton = styled(Button)`
  align-items: center;
  flex: 1;
  margin-left: 5px;
  margin-right: 5px;
`;

const ButtonArea = styled(View)`
  flex-direction: row;
  justify-content: space-around;
`;

const QROverlayScreen = styled(View)`
  position: relative;
  height: ${Dimensions.get("window").height}px;
`;

type Props = {
  navigation: {
    navigate: Function,
    state?: { params: { symbol: string, tokenId: ?string } }
  }
};

const SendSetupScreen = ({ navigation }: Props) => {
  const [toAddress, setToAddress] = useState("");
  const [qrOpen, setQrOpen] = useState(false);

  // Todo - Handle if send with nothing pre-selected on navigation
  const { symbol, tokenId } = (navigation.state && navigation.state.params) || {
    symbol: null,
    tokenId: null
  };

  return (
    <ScreenWrapper>
      {qrOpen && (
        <QROverlayScreen>
          <QRCodeScanner
            fadeIn={false}
            onRead={() => console.log("read QR")}
            cameraStyle={{
              height: Dimensions.get("window").width - 12,
              width: Dimensions.get("window").width - 12
            }}
            topViewStyle={{ height: "auto", flex: 0 }}
            topContent={
              <View>
                <Spacer />
                <H2>Scan QR Code</H2>
                <Spacer />
              </View>
            }
            bottomContent={
              <Button onPress={() => setQrOpen(false)} text="Cancel Scan" />
            }
          />
        </QROverlayScreen>
      )}
      <Spacer />
      <H1 center>Create Transaction</H1>

      {/* Setup / select coin or token */}
      {/* Setup / validate address */}
      {/* Set amount to send */}
      <Spacer />
      <T>Send To:</T>
      <Spacer small />
      <StyledTextInput
        editable
        multiline
        autoComplete="off"
        autoCorrect={false}
        autoFocus
        value={toAddress}
        onChangeText={text => {
          setToAddress(text);
        }}
      />
      <Spacer small />
      <ButtonArea>
        <StyledButton
          onPress={async () => {
            const content = await Clipboard.getString();
            setToAddress(content);
          }}
        >
          <Ionicons name="ios-clipboard" size={22} />
          <T>Paste</T>
        </StyledButton>
        <StyledButton text="Scan QR" onPress={() => setQrOpen(true)}>
          <Ionicons name="ios-qr-scanner" size={22} />
          <T>Scan QR</T>
        </StyledButton>
      </ButtonArea>
      <Spacer />
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
    </ScreenWrapper>
  );
};

export default SendSetupScreen;
