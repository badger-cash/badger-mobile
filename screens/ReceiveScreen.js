// @flow
import React from "react";
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

import { T, Spacer, H1, H2 } from "../atoms";

const QRHolder = styled(View)`
  justify-content: center;
  align-items: center;
  padding: 10px;
`;

type Props = {
  address: string,
  addressSlp: string
};

const ReceiveScreen = ({ address, addressSlp }: Props) => {
  return (
    <SafeAreaView>
      <ScrollView>
        <Spacer />
        <View style={{ padding: 10 }}>
          <T center>Scan a BCH or SLP code below to receive funds</T>
        </View>
        <Spacer small />
        <H2 center>Bitcoin Cash (BCH)</H2>
        <TouchableOpacity onPress={() => Clipboard.setString(address)}>
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
          </QRHolder>
        </TouchableOpacity>
        <Spacer />
        <H2 center>Simple Token (SLP)</H2>
        <TouchableOpacity onPress={() => Clipboard.setString(addressSlp)}>
          <T size="xsmall" center>
            {addressSlp}
          </T>
          <QRHolder>
            <QRCode
              value={addressSlp}
              size={150}
              bgColor="black"
              fgColor="white"
            />
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
