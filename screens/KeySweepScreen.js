// @flow

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import uuidv5 from "uuid/v5";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { sweepPaperWallet, getPaperBalance } from "../utils/transaction-utils";
import { type TokenData } from "../data/tokens/reducer";
import { updateTokensMeta } from "../data/tokens/actions";

import { T, H2, Spacer, Button } from "../atoms";

// Same as the Badger namespace for now.  doesn't need to be unique here.
const HASH_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

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

type SweepStates =
  | "neutral"
  | "scanned"
  | "pending"
  | "error"
  | "success"
  | "tokenSelect";

type Props = {
  addressBCH: string,
  addressSLP: string,
  tokensById: { [tokenId: string]: TokenData }
};

const KeySweepScreen = ({ addressBCH, addressSLP, tokensById }: Props) => {
  const [isCameraOpen: boolean, setCameraOpen] = useState(false);
  const [wif: ?string, setWif] = useState(null);
  const [paperBalance: number, setPaperBalance] = useState(0);
  const [sweepError: ?string, setSweepError] = useState(null);
  const [sweepState: SweepStates, setSweepState] = useState("neutral");

  const [tokenId: ?string, setTokenId] = useState(null);

  const allTokenIds = [];

  // Maybe need this if the list of tokenIds doesn't trigger effect
  // const tokenIdsHash = useMemo(() => {
  //   return uuidv5(tokenIds.join(""), HASH_UUID_NAMESPACE);
  // }, [allTokenIds])

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = allTokenIds.filter(tokenId => !tokensById[tokenId]);
    updateTokensMeta(missingTokenIds);
  }, [allTokenIds, tokensById]);

  const symbol = useMemo(() => {
    if (tokenId) {
      return tokensById[tokenId].symbol;
    }
    return "BCH";
  }, [tokenId, tokensById]);
  // const [symbol, setSymbol] = useState('BCH')

  const parseQr = useCallback((qrData: string): string => {
    return qrData ? qrData : "";
  }, []);

  const handleQRData = async qrData => {
    try {
      const balance = await getPaperBalance(qrData);
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
            <H2 center>Scan QR Code</H2>
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
            <Button text="Open QR Scanner" onPress={() => setCameraOpen(true)}>
              <T center spacing="loose" type="inverse">
                <Ionicons name="ios-qr-scanner" size={18} /> Open Camera
              </T>
            </Button>
            <Spacer />
          </View>

          <View style={{ flex: 1 }}>
            {sweepState === "neutral" && (
              <>
                <T size="small" center>
                  To recover Bitcoin Cash (BCH) or SLP Tokens from a paper
                  wallet, follow the steps below.
                </T>
                <Spacer />
                <T size="small">
                  1. Scan the private QR code on the paper wallet.
                </T>
                <Spacer small />
                <T size="small">2. Review details.</T>
                <Spacer small />
                <T size="small">3. Sweep to your Badger Wallet.</T>
                <Spacer small />
                <T size="small">4. Repeat until all funds have been swept.</T>
              </>
            )}
            {sweepState === "tokenSelect" && (
              <>
                <T weight="bold">
                  Multiple tokens detected, select one to sweep
                </T>
              </>
            )}
            {sweepState === "scanned" && (
              <>
                <T weight="bold">2. Review Details</T>
                <Spacer small />
                <T>Wif</T>
                <T>{wif}</T>
                <Spacer small />
                <T>Amount</T>
                <T>
                  {paperBalance} {symbol}
                </T>
                {tokenId && <T>{tokenId}</T>}
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
                  {paperBalance} {symbol}
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
                    await sweepPaperWallet(wif, addressBCH, addressSLP);
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
  addressBCH: getAddressSelector(state),
  addressSLP: getAddressSlpSelector(state),
  tokensById: tokensByIdSelector(state)
});

const mapDispatchToProps = { updateTokensMeta };

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(KeySweepScreen);
