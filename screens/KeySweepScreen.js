// @flow

import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  StyleSheet,
  ActivityIndicator,
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

const ErrorContainer = styled(View)`
  border-color: ${props => props.theme.accent500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 4px;
  padding: 16px 8px;
  background-color: ${props => props.theme.accent900};
`;
const SuccessContainer = styled(View)`
  border-color: ${props => props.theme.primary500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 4px;
  padding: 16px 8px;
  background-color: ${props => props.theme.primary900};
`;

type SweepStates = "neutral" | "scanned" | "pending" | "error" | "success";

type Props = {
  address: string
};
const KeySweepScreen = ({ address }: Props) => {
  const [isCameraOpen: boolean, setCameraOpen] = useState(false);
  const [wif: ?string, setWif] = useState(null);
  const [paperBalance: number, setPaperBalance] = useState(0);
  const [sweepError: ?string, setSweepError] = useState(null);
  const [sweepState: SweepStates, setSweepState] = useState("neutral");

  const parseQr = (qrData: string): string => {
    return qrData ? qrData : "";
  };

  const handleQRData = async qrData => {
    try {
      const balance = await sweep(qrData, null, true);
      setWif(qrData);
      setPaperBalance(balance);
      setSweepState("scanned");
    } catch (e) {
      setSweepState("error");
      setSweepError(e.message || "Error scanning wallet");
    }
    return;
  };

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper>
        {isCameraOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>Scan QR Code ?</H2>
            <Spacer small />
            <View style={{ height: Dimensions.get("window").width - 12 }}>
              <QRCodeScanner
                cameraProps={{ ratio: "1:1", captureAudio: false }}
                fadeIn={false}
                onRead={e => {
                  const qrData = e.data;
                  const parsedData = parseQr(qrData);
                  setSweepState("pending");
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
          <View>
            <Spacer />
            <T weight="bold">1. Scan QR</T>
            <Spacer small />
            <Button
              // nature="ghost"
              text="Open QR Scanner"
              onPress={() => setCameraOpen(true)}
            >
              <T center spacing="loose" type="inverse">
                <Ionicons name="ios-qr-scanner" size={18} /> Open Camera
              </T>
            </Button>
            <Spacer />
          </View>

          <View style={{ flex: 1 }}>
            {sweepState === "scanned" && (
              <>
                <T weight="bold">2. Review Details</T>
                <Spacer small />
                <T>Wif</T>
                <T>{wif}</T>
                <Spacer small />
                <T>Amount</T>
                <T>{paperBalance} BCH</T>
                <Spacer />
              </>
            )}
            {sweepState === "pending" && (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <ActivityIndicator size="large" />
              </View>
            )}
            {sweepState === "success" && (
              <SuccessContainer>
                <T type="primary" center weight="bold">
                  Sweep Complete
                </T>
                <Spacer small />
                <T type="primary" center weight="bold">
                  {paperBalance} BCH
                </T>
              </SuccessContainer>
            )}
            {sweepState === "error" && (
              <ErrorContainer>
                <T type="accent" center>
                  {sweepError}
                </T>
                <T type="accent" center>
                  Please try again
                </T>
              </ErrorContainer>
            )}
          </View>

          {sweepState === "scanned" && (
            <View>
              <T weight="bold">3. Sweep Funds</T>
              <Spacer small />
              <Button
                text="Confirm Sweep"
                onPress={async () => {
                  try {
                    setSweepState("pending");
                    await sweep(wif, address);
                    setSweepState("success");
                  } catch (e) {
                    setSweepState("error");
                    setSweepError("Sweep failed, please try again");
                  }
                }}
              />
              <Spacer />
            </View>
          )}
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
