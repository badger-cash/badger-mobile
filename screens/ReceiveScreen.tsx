import React, { useState, useEffect, useRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import { NavigationEvents } from "react-navigation";
import styled, { css } from "styled-components";
import {
  Clipboard,
  Dimensions,
  Image,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  View
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { addressToSlp } from "../utils/account-utils";

import { T, Spacer, H2 } from "../atoms";

import BitcoinCashImage from "../assets/images/icon.png";
import SLPImage from "../assets/images/slp-logo.png";
import { FullState } from "../data/store";

const ToggleRow = styled(View)`
  justify-content: center;
  flex-direction: row;
`;

const ToggleBase = css<{ isActive: boolean }>`
  height: 42px;
  flex: 1;
  justify-content: center;
  align-items: center;
  border-width: ${StyleSheet.hairlineWidth};
  border-color: ${props => props.theme.primary500};
  ${props =>
    props.isActive &&
    css`
      background-color: ${props.theme.primary500};
    `}
`;

const ToggleRight = styled(TouchableOpacity)`
  ${ToggleBase};
  border-bottom-right-radius: 8;
  border-top-right-radius: 8;
`;
const ToggleLeft = styled(TouchableOpacity)`
  ${ToggleBase};
  border-bottom-left-radius: 8;
  border-top-left-radius: 8;
`;

const QRHolder = styled(View)`
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  position: relative;
`;

const TypeOverlay = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const TypeImage = styled(Image)<{ size: number }>`
  height: ${props => props.size * 0.15}px;
  width: ${props => props.size * 0.15}px;
  border-radius: ${props => props.size * 0.075}px;
  border-width: 3px;
  border-color: ${props => props.theme.bg900};
`;

const QROverlay = styled(View)`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: white;
  align-items: center;
  justify-content: center;
  opacity: 0.98;
  z-index: 3;
`;

type PropsFromParent = {};

const mapStateToProps = (state: FullState) => ({
  address: getAddressSelector(state),
  addressSlp: getAddressSlpSelector(state)
});

const mapDispatchToProps = {};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const ReceiveScreen = ({ address, addressSlp }: Props) => {
  const scrollRef = useRef<ScrollView>(null);
  const [showing, setShowing] = useState("BCH");
  const [copyNotify, setCopyNotify] = useState("");

  const [simpleLedgerAddr, setSimpleLedgerAddr] = useState(addressSlp);

  const QRSize = Dimensions.get("window").width * 0.65;

  useEffect(() => {
    const convertAddress = async () => {
      const convertedAddress = await addressToSlp(addressSlp);
      setSimpleLedgerAddr(convertedAddress);
    };

    if (!addressSlp) return;
    convertAddress();
  }, [addressSlp]);

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={() => {
          setCopyNotify("");
        }}
      />
      <ScrollView
        style={{
          padding: 10
        }}
        ref={scrollRef}
      >
        <Spacer small />
        <T center>
          Scan a public key below to receive funds. Tap on a QR code to copy the
          address.
        </T>
        <Spacer />
        <ToggleRow>
          <ToggleLeft
            isActive={showing === "BCH"}
            onPress={() => {
              setShowing("BCH");
              setCopyNotify("");
            }}
          >
            <T weight="bold" type={showing === "BCH" ? "inverse" : "primary"}>
              BCH
            </T>
          </ToggleLeft>
          <ToggleRight
            isActive={showing === "SLP"}
            onPress={() => {
              setShowing("SLP");
              setCopyNotify("");
            }}
          >
            <T weight="bold" type={showing === "SLP" ? "inverse" : "primary"}>
              SLP
            </T>
          </ToggleRight>
        </ToggleRow>
        <Spacer />
        {showing === "BCH" && (
          <>
            <H2 center>Bitcoin Cash (BCH)</H2>
            <Spacer tiny />

            <TouchableOpacity
              onPress={() => {
                if (showing === "BCH") {
                  Clipboard.setString(address);
                  setCopyNotify("BCH");
                }
              }}
            >
              <T size="xsmall" center>
                bitcoincash:
              </T>
              <T size="xsmall" center>
                {address && address.split(":")[1]}
              </T>
              <Spacer tiny />

              {address && (
                <QRHolder>
                  <QRCode
                    value={address}
                    size={QRSize}
                    color="black"
                    backgroundColor="white"
                  />
                  <TypeOverlay>
                    <TypeImage source={BitcoinCashImage} size={QRSize} />
                  </TypeOverlay>
                  {showing !== "BCH" && (
                    <QROverlay>
                      <T>Tap to show</T>
                    </QROverlay>
                  )}
                </QRHolder>
              )}
            </TouchableOpacity>
            <Spacer tiny />
            <T center size="small" type="primary">
              {copyNotify === "BCH" ? "Copied BCH Address" : " "}
            </T>
          </>
        )}

        {showing === "SLP" && (
          <>
            <H2 center>Simple Token (SLP)</H2>
            <Spacer tiny />
            <TouchableOpacity
              onPress={() => {
                if (showing === "SLP") {
                  Clipboard.setString(simpleLedgerAddr);
                  setCopyNotify("SLP");
                }
              }}
            >
              <T size="xsmall" center>
                simpleledger:
              </T>
              <T size="xsmall" center>
                {simpleLedgerAddr && simpleLedgerAddr.split(":")[1]}
              </T>
              <Spacer tiny />

              {simpleLedgerAddr && (
                <QRHolder>
                  <QRCode
                    value={simpleLedgerAddr}
                    size={QRSize}
                    color="black"
                    backgroundColor="white"
                  />
                  <TypeOverlay>
                    <TypeImage source={SLPImage} size={QRSize} />
                  </TypeOverlay>
                  {showing !== "SLP" && (
                    <QROverlay>
                      <T>Tap to show</T>
                    </QROverlay>
                  )}
                </QRHolder>
              )}
            </TouchableOpacity>
            <Spacer tiny />
            <T center size="small" type="primary">
              {copyNotify === "SLP" ? "Copied SLP Address" : " "}
            </T>
          </>
        )}

        <Spacer />
      </ScrollView>
    </SafeAreaView>
  );
};

export default connector(ReceiveScreen);
