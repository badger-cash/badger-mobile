// @flow

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Clipboard,
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
// import uuidv5 from "uuid/v5";

import { type BigNumber } from "bignumber";

import { type UTXO } from "../data/utxos/reducer";
import { type ECPair } from "../data/accounts/reducer";

import {
  getKeypairSelector,
  activeAccountSelector,
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";

// Probably don't need any advanced token display
import { tokensByIdSelector } from "../data/tokens/selectors";
import { type TokenData } from "../data/tokens/reducer";
import { updateTokensMeta } from "../data/tokens/actions";

import {
  sweepPaperWallet,
  getUtxosBalances,
  getPaperKeypair,
  getPaperUtxos
} from "../utils/transaction-utils";

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
  ownUtxos: UTXO[],
  ownKeypair: { bch: ECPair, slp: ECPair },
  tokensById: { [tokenId: string]: TokenData }
};

const KeySweepScreen = ({
  addressBCH,
  addressSLP,
  tokensById,
  ownUtxos,
  ownKeypair
}: Props) => {
  const [isCameraOpen: boolean, setCameraOpen] = useState(false);
  const [wif: ?string, setWif] = useState(null);

  // const [paperBalance: number, setPaperBalance] = useState(0);

  const [
    paperBalances: { [balanceKey: string]: BigNumber },
    setPaperBalances
  ] = useState([]);

  const [utxosByKey, setUtxosByKey] = useState({});

  // const [tokenIdSweep, setTokenIdSweep] = useState(null)

  const [sweepError: ?string, setSweepError] = useState(null);
  const [sweepState: SweepStates, setSweepState] = useState("neutral");

  // Token ID to sweep, useful when there's more than 1 token on a paper wallet
  const [tokenId: ?string, setTokenId] = useState(null);

  const allTokenIds = [];

  // Maybe need this if the list of tokenIds doesn't trigger effect
  // const tokenIdsHash = useMemo(() => {
  //   return uuidv5(tokenIds.join(""), HASH_UUID_NAMESPACE);
  // }, [allTokenIds])

  // Fetch token metadata if any are missing
  useEffect(() => {
    const missingTokenIds = allTokenIds.filter(
      currTokenId => !tokensById[currTokenId]
    );
    updateTokensMeta(missingTokenIds);
  }, [allTokenIds, tokensById]);

  const symbolToken = useMemo(() => {
    if (tokenId) {
      return tokensById[tokenId].symbol;
    }
    return null;
  }, [tokenId, tokensById]);

  const tokenDecimals = useMemo(() => {
    if (tokenId) {
      return tokensById[tokenId].decimals;
    }
    return null;
  }, [tokenId, tokensById]);
  // const [symbol, setSymbol] = useState('BCH')

  const parseQr = useCallback((qrData: string): string => {
    return qrData ? qrData : "";
  }, []);

  // consider removing callbak if it doesn't work
  const handleQRData = useCallback(async (qrData: ?string) => {
    setWif(null);
    setPaperBalances(null);
    setUtxosByKey(null);

    try {
      const keypair = await getPaperKeypair(qrData);
      const utxosAll = await getPaperUtxos(keypair);
      const balancesByKey = await getUtxosBalances(utxosAll);

      const paperBalanceKeys = Object.keys(balancesByKey);
      const keysWithoutBCH = paperBalanceKeys.filter(val => val !== "BCH");

      const tokenAmount = keysWithoutBCH.length;

      setWif(qrData);
      setPaperBalances(balancesByKey);
      setUtxosByKey(utxosAll);

      if (tokenAmount > 1) {
        setSweepState("tokenSelect");
      } else {
        setTokenId(tokenAmount === 1 ? keysWithoutBCH[0] : null);
        setSweepState("scanned");
      }
    } catch (e) {
      setSweepState("error");
      setSweepError(e.message || "Error scanning paper wallet");
    }
  }, []);

  const confirmSweep = useCallback(async () => {
    try {
      setSweepState("pending");
      await sweepPaperWallet(
        wif,
        utxosByKey,
        addressBCH,
        addressSLP,
        tokenId,
        tokenDecimals,
        ownUtxos,
        ownKeypair
      );
      setSweepState("success");
    } catch (e) {
      setSweepState("error");
      setSweepError("Sweep failed, please try again");
    }
  }, [
    wif,
    utxosByKey,
    addressBCH,
    addressSLP,
    tokenId,
    tokenDecimals,
    setSweepState,
    setSweepError,
    ownKeypair,
    ownUtxos
  ]);

  const handleScan = useCallback(
    e => {
      const qrData = e.data;
      const parsedData = parseQr(qrData);
      setSweepState("pending");
      handleQRData(parsedData);
      setCameraOpen(false);
    },
    [handleQRData, parseQr]
  );

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper>
        {isCameraOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>Scan QR Code</H2>
            <H2
              onPress={async () => {
                const content = await Clipboard.getString();
                handleScan({ data: content });
              }}
            >
              paste
            </H2>
            <Spacer small />
            <View style={{ height: Dimensions.get("window").width - 12 }}>
              <QRCodeScanner
                cameraProps={{ ratio: "1:1", captureAudio: false }}
                fadeIn={false}
                onRead={handleScan}
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
                <T size="small">2. Select a token if there are multiple.</T>
                <Spacer small />
                <T size="small">3. Review details.</T>
                <Spacer small />
                <T size="small">4. Sweep to your Badger Wallet.</T>
                <Spacer small />
                <T size="small">
                  5. Repeat until all BCH and tokens have been swept.
                </T>
              </>
            )}
            {sweepState === "tokenSelect" && (
              <>
                <T weight="bold">
                  Multiple SLP tokens detected, select one to sweep
                </T>
                <Spacer />
                {Object.entries(paperBalances).map(item => {
                  if (item[0] === "BCH") return null;
                  return (
                    <>
                      <Spacer small />
                      <T
                        weight="bold"
                        onPress={() => {
                          setTokenId(item[0]);
                          setSweepState("scanned");
                        }}
                      >{`${tokensById[item[0]].name} (${
                        tokensById[item[0]].symbol
                      }) - ${paperBalances[item[0]]}`}</T>
                    </>
                  );
                })}
              </>
            )}
            {sweepState === "scanned" && (
              <>
                <T weight="bold">Review Details</T>
                <Spacer small />
                <T>Wif</T>
                <T>{wif}</T>
                <Spacer small />
                {paperBalances["BCH"] && (
                  <>
                    <T>Amount - BCH</T>
                    <T weight="bold">{paperBalances["BCH"].toFormat()} BCH</T>
                    <Spacer />
                  </>
                )}
                {paperBalances[tokenId] && (
                  <>
                    <T>Amount - Token</T>
                    <T weight="bold">
                      {paperBalances[tokenId].toFormat()} {symbolToken}
                    </T>
                    <T size="xsmall">{tokenId}</T>
                    <Spacer />
                  </>
                )}
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
                <Spacer />
                {paperBalances["BCH"] && (
                  <T type="primary" center weight="bold">
                    {paperBalances["BCH"].toFormat()} BCH
                  </T>
                )}
                <Spacer small />
                {paperBalances[tokenId] && (
                  <>
                    <T type="primary" center weight="bold">
                      {paperBalances[tokenId].toFormat()} {symbolToken}
                    </T>
                  </>
                )}
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
              <T weight="bold">Sweep Funds</T>
              <Spacer small />
              <Button text="Confirm Sweep" onPress={confirmSweep} />
              <Spacer />
            </View>
          )}
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(state, activeAccount.address);
  const keypair = getKeypairSelector(state);

  return {
    ownUtxos: utxos,
    ownKeypair: keypair,
    addressBCH: getAddressSelector(state),
    addressSLP: getAddressSlpSelector(state),
    tokensById: tokensByIdSelector(state)
  };
};

const mapDispatchToProps = { updateTokensMeta };

export default connect(mapStateToProps, mapDispatchToProps)(KeySweepScreen);
