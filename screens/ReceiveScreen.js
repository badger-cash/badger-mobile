// @flow

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { NavigationEvents } from "react-navigation";
import styled from "styled-components";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  Clipboard
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { addressToSlp } from "../utils/account-utils";

import { T, Spacer, H2 } from "../atoms";

const QRHolder = styled(View)`
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  position: relative;
`;

const QROverlay = styled(View)`
  position: absolute;
  height: 150px;
  width: 150px;
  background-color: white;
  align-items: center;
  justify-content: center;
  padding: 15px;
  opacity: 0.98;
  z-index: 2;
`;

type Props = {
  address: string,
  addressSlp: string
};

const ReceiveScreen = ({ address, addressSlp }: Props) => {
  const [showing, setShowing] = useState("BCH");
  const [copyNotify, setCopyNotify] = useState("");

  const [simpleLedgerAddr, setSimpleLedgerAddr] = useState(addressSlp);

  const convertAddress = async () => {
    const convertedAddress = await addressToSlp(addressSlp);
    setSimpleLedgerAddr(convertedAddress);
  };

  useEffect(() => {
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
      <ScrollView style={{ padding: 10 }}>
        <Spacer small />
        <T center>
          Scan a public key below to receive funds. Tap to reveal or copy the
          address to clipboard.
        </T>
        <Spacer />
        <H2 center>Bitcoin Cash (BCH)</H2>
        <Spacer tiny />

        <TouchableOpacity
          onPress={() => {
            if (showing === "BCH") {
              Clipboard.setString(address);
              setCopyNotify("BCH");
              return;
            }
            setShowing("BCH");
            setCopyNotify("");
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
                size={125}
                bgColor="black"
                fgColor="white"
              />
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
        <Spacer />
        <H2 center>Simple Token (SLP)</H2>
        <Spacer tiny />
        <TouchableOpacity
          onPress={() => {
            if (showing === "SLP") {
              Clipboard.setString(simpleLedgerAddr);
              setCopyNotify("SLP");
              return;
            }
            setShowing("SLP");
            setCopyNotify("");
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
                size={125}
                bgColor="black"
                fgColor="white"
              />
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
        <Spacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({
  address: getAddressSelector(state),
  addressSlp: getAddressSlpSelector(state)
});

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ReceiveScreen);
