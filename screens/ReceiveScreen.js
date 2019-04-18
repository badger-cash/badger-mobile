// @flow
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  SafeAreaView,
  View,
  ScrollView,
  TouchableOpacity,
  Clipboard
} from "react-native";
import QRCode from "react-native-qrcode";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { addressToSlp } from "../utils/account-utils";

import { T, Spacer, H1, H2 } from "../atoms";

const QRHolder = styled(View)`
  justify-content: center;
  align-items: center;
  padding: 10px;
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
  opacity: 0.95;
  z-index: 2;
`;

type Props = {
  address: string,
  addressSlp: string
};

const ReceiveScreen = ({ address, addressSlp }: Props) => {
  const [showing, setShowing] = useState("BCH");

  const [simpleLedgerAddr, setSimpleLedgerAddr] = useState(addressSlp);

  const convertAddress = async () => {
    const convertedAddress = await addressToSlp(addressSlp);
    setSimpleLedgerAddr(convertedAddress);
  };

  useEffect(() => {
    convertAddress();
  }, [addressSlp]);

  return (
    <SafeAreaView>
      <ScrollView style={{ padding: 10 }}>
        <Spacer small />
        <T center>
          Scan a public key below to receive funds. Click to reveal or copy the
          address to clipboard.
        </T>
        <Spacer />
        <H2 center>Bitcoin Cash (BCH)</H2>

        <TouchableOpacity
          onPress={() =>
            showing === "BCH" ? Clipboard.setString(address) : setShowing("BCH")
          }
        >
          <T size="xsmall" center>
            {address}
          </T>

          <QRHolder>
            <QRCode
              value={address}
              size={150}
              bgColor="black"
              fgColor="white"
            />
            {showing !== "BCH" && (
              <QROverlay>
                <T>Tap to show</T>
              </QROverlay>
            )}
          </QRHolder>
        </TouchableOpacity>
        <Spacer />
        <H2 center>Simple Token (SLP)</H2>
        <TouchableOpacity
          onPress={() =>
            showing === "SLP"
              ? Clipboard.setString(simpleLedgerAddr)
              : setShowing("SLP")
          }
        >
          <T size="xsmall" center>
            {simpleLedgerAddr}
          </T>

          <QRHolder>
            <QRCode
              value={simpleLedgerAddr}
              size={150}
              bgColor="black"
              fgColor="white"
            />
            {showing !== "SLP" && (
              <QROverlay>
                <T>Tap to show</T>
              </QROverlay>
            )}
          </QRHolder>
        </TouchableOpacity>
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
