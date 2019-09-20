// @flow

import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Linking,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { connect } from "react-redux";
import styled from "styled-components";
import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";

import { getAddressSelector } from "../data/accounts/selectors";
import { sweep } from "../utils/transaction-utils";

import { T, H2, Spacer, Button } from "../atoms";

const ScreenWrapper = styled(View)`
  position: relative;
  flex: 1;
`;

const QROverlayScreen = styled(View)`
  position: absolute;
  padding: 0 16px;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: ${Dimensions.get("window").width}px;
  height: ${Dimensions.get("window").height}px;
  z-index: 1;
  background-color: ${props => props.theme.bg900};
`;

type Props = {
  address: string
};
const KeySweepScreen = ({ address }: Props) => {
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [wif, setWif] = useState(null);
  const [paperBalance, setPaperBalance] = useState(0);
  const [sweepError, setSweepError] = useState(null);
  const [sweepState, setSweepState] = useState("neutral");

  const parseQr = (
    qrData: string
  ): {
    privateKey: ?string
  } => {
    let privateKey = null;

    console.log(qrData);
    return qrData ? qrData : "";
    // let address = null;
    // let amount = null;
    // let uriTokenId = null;
    // let parseError = null;

    // let amounts = [];

    // Parse out address and any other relevant data
    // const parts = qrData.split("?");

    // address = parts[0];
    // const parameters = parts[1];
    // if (parameters) {
    //   const parameterParts = parameters.split("&");
    //   parameterParts.forEach(param => {
    //     const [name, value] = param.split("=");
    //     if (name.startsWith("amount")) {
    //       let currTokenId;
    //       let currAmount;
    //       if (value.includes("-")) {
    //         [currAmount, currTokenId] = value.split("-");
    //       } else {
    //         currAmount = value;
    //       }
    //       amounts.push({ tokenId: currTokenId, paramAmount: currAmount });
    //     }
    //   });
    // }

    // if (amounts.length > 1) {
    //   parseError =
    //     "Badger Wallet currently only supports sending one coin at a time.  The URI is requesting multiple coins.";
    // } else if (amounts.length === 1) {
    //   const target = amounts[0];
    //   uriTokenId = target.tokenId;
    //   amount = target.paramAmount;
    // }

    // return {
    //   address,
    //   amount,
    //   parseError,
    //   tokenId: uriTokenId
    // };
  };

  const handleQRData = async qrData => {
    console.log("!!!!!!!!!");
    console.log(qrData);
    const balance = await sweep(qrData, null, true);

    console.log(balance);
    setWif(qrData);
    setPaperBalance(balance);
    return null;
  };

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper>
        {isCameraOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>Scan QR Code</H2>
            <Spacer small />
            <View style={{ height: Dimensions.get("window").width - 12 }}>
              <QRCodeScanner
                cameraProps={{ ratio: "1:1", captureAudio: false }}
                fadeIn={false}
                onRead={e => {
                  const qrData = e.data;
                  const parsedData = parseQr(qrData);

                  console.log("parsed?");
                  console.log(parsedData);

                  handleQRData(parsedData);
                  setCameraOpen(false);
                }}
                cameraStyle={{
                  // padding 16 for each side
                  height: Dimensions.get("window").width - 32,
                  width: Dimensions.get("window").width - 32
                }}
              />
            </View>
            <Spacer />
            <Button
              nature="cautionGhost"
              onPress={() => setCameraOpen(false)}
              text="Cancel Scan"
            />
          </QROverlayScreen>
        )}

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingRight: 16,
            paddingLeft: 16
          }}
        >
          <Spacer small />
          <T weight="bold" center>
            Sweep funds from a paper wallet {sweepState}
          </T>

          <Spacer />
          <Button
            nature="ghost"
            text="Open QR Scanner"
            onPress={() => setCameraOpen(true)}
          >
            <T center spacing="loose" type="primary" size="small">
              <Ionicons name="ios-qr-scanner" size={18} /> Open QR Scanner
            </T>
          </Button>
          <Spacer />
          <T weight="bold">Wif</T>
          <T>{wif}</T>
          <Spacer />

          <T weight="bold">Amount</T>
          <T>{paperBalance} BCH</T>

          <Spacer />
          <Button
            text="Confirm Sweep"
            onPress={async () => {
              try {
                setSweepState("pending");
                await sweep(wif, address);
                setSweepState("success");
              } catch (e) {
                setSweepState("fail");
                console.log("--------------!!!!!!!0000");
                console.log(e);
                console.log("--------------!!!!!!!0000");
                setSweepError("Sweep failed, try again");
              }
            }}
          />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  address: getAddressSelector(state)
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KeySweepScreen);
