import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
  Clipboard,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";

import { BigNumber } from "bignumber.js";

import { FullState } from "../data/store";

import {
  getKeypairSelector,
  activeAccountSelector,
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";

import { tokensByIdSelector } from "../data/tokens/selectors";
import { updateTokensMeta } from "../data/tokens/actions";

import {
  sweepPaperWallet,
  getUtxosBalances,
  getPaperKeypair,
  getPaperUtxos
} from "../utils/transaction-utils";

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

const TokenCard = styled(View)`
  padding: 8px;
  background-color: ${props => props.theme.fg700};
  border-color: ${props => props.theme.fg500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 4px;
`;

type SweepStates =
  | "neutral"
  | "scanned"
  | "pending"
  | "error"
  | "success"
  | "tokenSelect";

type PropsFromParent = NavigationScreenProps & {};

const mapStateToProps = (state: FullState) => {
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(
    state,
    activeAccount && activeAccount.address
  );

  const keypair = getKeypairSelector(state);
  return {
    ownUtxos: utxos,
    ownKeypair: keypair,

    addressBCH: getAddressSelector(state),
    addressSLP: getAddressSlpSelector(state),
    tokensById: tokensByIdSelector(state)
  };
};

const mapDispatchToProps = {
  updateTokensMeta
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromParent & PropsFromRedux;

const KeySweepScreen = ({
  addressBCH,
  addressSLP,
  tokensById,
  ownUtxos,
  ownKeypair,
  updateTokensMeta
}: Props) => {
  const [isCameraOpen, setCameraOpen] = useState(false);
  const [wif, setWif] = useState<string | null>(null);

  const [paperBalances, setPaperBalances] = useState<{
    [symbol: string]: BigNumber;
  }>({});
  const [utxosByKey, setUtxosByKey] = useState({});
  const [sweepError, setSweepError] = useState<string | null>(null);
  const [sweepState, setSweepState] = useState<SweepStates>("neutral");
  const [tokenId, setTokenId] = useState<string | null>(null);
  const allTokenIds = useMemo(() => {
    return paperBalances
      ? Object.keys(paperBalances).filter(current => current !== "BCH")
      : [];
  }, [paperBalances]);

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = allTokenIds.filter(
      currTokenId => !tokensById[currTokenId]
    );

    if (missingTokenIds.length) {
      updateTokensMeta(missingTokenIds);
    }
  }, [allTokenIds, tokensById, updateTokensMeta]);

  const symbolToken = useMemo(() => {
    if (tokenId && tokensById[tokenId]) {
      return tokensById[tokenId].symbol;
    }

    return null;
  }, [tokenId, tokensById]);

  const tokenDecimals = useMemo(() => {
    if (tokenId && tokensById[tokenId]) {
      return tokensById[tokenId].decimals;
    }

    return null;
  }, [tokenId, tokensById]);

  const parseQr = useCallback((qrData: string): string => {
    return qrData ? qrData : "";
  }, []);

  const handleQRData = useCallback(async (qrData: string | null) => {
    setWif(null);
    setPaperBalances({});

    setUtxosByKey({});

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
      setSweepError(
        "Sweep failed, ensure your wallet or the paper wallet has BCH for the transaction fee"
      );
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
  const hasBalance =
    paperBalances &&
    (paperBalances["BCH"] || (tokenId && paperBalances[tokenId]));

  return (
    <SafeAreaView
      style={{
        height: "100%"
      }}
    >
      <ScreenWrapper>
        {isCameraOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>Scan QR Code</H2>
            <Spacer small />
            {/* Uncomment below to easily test on emulators */}
            {/* <H2
              onPress={async () => {
                const content = await Clipboard.getString();
                handleScan({ data: content });
              }}
            >
              paste
            </H2> */}
            <View
              style={{
                height: Dimensions.get("window").width - 12
              }}
            >
              <QRCodeScanner
                cameraProps={{
                  ratio: "1:1",
                  captureAudio: false
                }}
                fadeIn={false}
                onRead={handleScan}
                cameraStyle={{
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
            <T weight="bold">Scan QR</T>
            <Spacer tiny />
            <Button text="Open QR Scanner" onPress={() => setCameraOpen(true)}>
              <T center spacing="loose" type="inverse" weight="bold">
                <Ionicons name="ios-qr-code-outline" size={18} /> Open Camera
              </T>
            </Button>
            <Spacer />
          </View>

          <View
            style={{
              flex: 1
            }}
          >
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
                <T>
                  Multiple SLP tokens detected, select one to sweep first...
                </T>
                <Spacer small />
                {Object.entries(paperBalances).map(item => {
                  if (item[0] === "BCH") return null;
                  return (
                    <View key={item[0]}>
                      <Spacer small />
                      <TouchableOpacity
                        onPress={() => {
                          setTokenId(item[0]);
                          setSweepState("scanned");
                        }}
                      >
                        <TokenCard>
                          {tokensById[item[0]] ? (
                            <>
                              <T>{`${tokensById[item[0]].symbol} - ${
                                tokensById[item[0]].name
                              }`}</T>
                              <T weight="bold">{`${paperBalances[item[0]]} ${
                                tokensById[item[0]].symbol
                              }`}</T>
                              <T size="tiny" type="muted">
                                {`${tokensById[item[0]].tokenId}`}
                              </T>
                            </>
                          ) : (
                            <ActivityIndicator size="large" color="green" />
                          )}
                        </TokenCard>
                      </TouchableOpacity>
                    </View>
                  );
                })}
                <Spacer small />
              </>
            )}
            {sweepState === "scanned" && (
              <>
                <T weight="bold">Review Details</T>
                <Spacer small />
                <T weight="bold" type="muted2">
                  Wif
                </T>
                <Spacer tiny />
                <T monospace size="small">
                  {wif}
                </T>
                <Spacer />
                <T weight="bold" type="muted2">
                  Balance to Sweep
                </T>
                <Spacer tiny />
                {paperBalances["BCH"] && (
                  <>
                    <T>Bitcoin Cash</T>
                    <Spacer minimal />
                    <T weight="bold">{paperBalances["BCH"].toFormat()} BCH</T>
                    <Spacer small />
                  </>
                )}
                {tokenId && paperBalances[tokenId] && (
                  <>
                    <T>SLP Token</T>
                    <Spacer minimal />
                    <T weight="bold">
                      {paperBalances[tokenId].toFormat()} {symbolToken}
                    </T>
                    <T size="tiny" type="muted">
                      {tokenId}
                    </T>
                  </>
                )}

                {!hasBalance && (
                  <>
                    <T>No balances found on this paper wallet</T>
                    <Spacer small />
                    <T>
                      If the funds appear on a block explorer, wait a few
                      minutes and try again.
                    </T>
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
                <ActivityIndicator size="large" color="green" />
              </View>
            )}
            {sweepState === "success" && (
              <>
                <T type="primary" center weight="bold">
                  Sweep Success!
                </T>
                <Spacer small />
                <SuccessContainer>
                  {paperBalances["BCH"] && (
                    <>
                      <Spacer small />
                      <T type="primary" center weight="bold">
                        Bitcoin Cash
                      </T>
                      <T type="primary" size="large" center weight="bold">
                        {paperBalances["BCH"].toFormat()} BCH
                      </T>
                    </>
                  )}
                  {tokenId && paperBalances[tokenId] && (
                    <>
                      <Spacer small />
                      <T type="primary" center weight="bold">
                        SLP Token
                      </T>
                      <T type="primary" center size="large" weight="bold">
                        {paperBalances[tokenId].toFormat()} {symbolToken}
                      </T>
                    </>
                  )}
                  <Spacer small />
                </SuccessContainer>
                <Spacer />
                <T size="small" type="muted" center>
                  Sweep again if this paper wallet had more than 1 type of SLP
                  token.
                </T>
              </>
            )}
            {sweepState === "error" && (
              <ErrorContainer>
                <T type="accent" center>
                  {sweepError}
                </T>
                <Spacer small />
                <T type="accent" center>
                  Please try again
                </T>
              </ErrorContainer>
            )}
          </View>

          {sweepState === "scanned" && hasBalance && (
            <View>
              <Spacer small />
              <T weight="bold" type="muted">
                Sweep Funds
              </T>
              <Spacer tiny />
              <Button text="Confirm Sweep" onPress={confirmSweep} />
              <Spacer />
            </View>
          )}
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default connector(KeySweepScreen);
