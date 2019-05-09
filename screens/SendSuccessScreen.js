// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import { View, ScrollView, SafeAreaView, Image } from "react-native";
import styled from "styled-components";
import _ from "lodash";

import makeBlockie from "ethereum-blockies-base64";
import Ionicons from "react-native-vector-icons/Ionicons";

import SLPSDK from "slp-sdk";

import BitcoinCashImage from "../assets/images/icon.png";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector } from "../data/prices/selectors";

import { updateUtxos } from "../data/utxos/actions";
import { updateTransactions } from "../data/transactions/actions";

import { Button, T, Spacer, H1, H2 } from "../atoms";

import { getTokenImage } from "../utils/token-utils";

const SLP = new SLPSDK();

const ScreenCover = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.success700};
  padding: 0 16px;
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;
const IconImage = styled(Image)`
  width: 64;
  height: 64;
  border-radius: 32;
  overflow: hidden;
`;

type Props = {
  navigation: { navigate: Function, state: { params: { txParams: any } } },
  address: string,
  addressSlp: string,
  spotPrices: any,
  updateUtxos: Function,
  updateTransactions: Function,
  tokensById: any
};
const SendSuccessScreen = ({
  address,
  addressSlp,
  tokensById,
  navigation,
  spotPrices,
  updateUtxos,
  updateTransactions
}: Props) => {
  const { txParams } = navigation.state.params;
  const { to, from, value, data } = txParams;

  const tokenId = txParams.sendTokenData && txParams.sendTokenData.tokenId;

  useEffect(() => {
    // Slight delay so api returns updated info.  Otherwise gets updated in standard interval
    _.delay(() => updateUtxos(address, addressSlp), 1750);
    _.delay(() => updateTransactions(address, addressSlp, 2000));
  }, [address, addressSlp]);

  const imageSource = getTokenImage(tokenId);

  const toConverted = tokenId
    ? SLP.Address.toSLPAddress(to)
    : SLP.Address.toCashAddress(to);
  // toAddress like
  // -> simpleledger:qq2addressHash
  // -> l344f3legacyFormatted
  const addressParts = toConverted.split(":");
  const toAddress =
    addressParts.length === 2 ? addressParts[1] : addressParts[0];
  const protocol = addressParts.length === 2 ? addressParts[0] : "legacy";

  const addressStart = toAddress.slice(0, 5);
  const addressMiddle = toAddress.slice(5, -6);
  const addressEnd = toAddress.slice(-6);

  const coinName = tokenId ? tokensById[tokenId].name : "Bitcoin Cash";
  const symbol = tokenId ? tokensById[tokenId].symbol : "BCH";

  // Tokens absolute amount, BCH it's # of satoshis
  const valueAdjusted = tokenId ? value : value / 10 ** 8;

  const isBCH = !tokenId;
  const BCHFiatAmount = isBCH
    ? spotPrices["bch"]["usd"].rate * valueAdjusted
    : 0;
  const fiatDisplay = isBCH
    ? spotPrices["bch"]["usd"].rate
      ? `$${BCHFiatAmount.toFixed(3)} USD`
      : "$ -.-- USD"
    : null;

  return (
    <ScreenCover>
      <SafeAreaView style={{ height: "100%" }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Spacer small />
          <H1 center>Success!</H1>
          <Spacer small />
          <IconArea>
            <IconImage source={imageSource} />
          </IconArea>
          <Spacer small />
          <H2 center>
            {coinName} ({symbol})
          </H2>
          {tokenId && (
            <T size="tiny" center>
              {tokenId}
            </T>
          )}
          <Spacer />
          <H2 center>Sent</H2>
          <Spacer small />
          <H2 center>
            {valueAdjusted} {symbol}
          </H2>
          {fiatDisplay && (
            <T center type="muted2">
              {fiatDisplay}
            </T>
          )}
          <Spacer large />
          <H2 center>To Address</H2>
          <Spacer small />
          <T size="small" center>
            {protocol}:
          </T>
          <T center>
            <T style={{ fontWeight: "bold" }}>{addressStart}</T>
            <T size="small">{addressMiddle}</T>
            <T style={{ fontWeight: "bold" }}>{addressEnd}</T>
          </T>
          <Spacer fill />
          <Spacer small />
          <Button
            style={{ marginLeft: 7, marginRight: 7 }}
            onPress={() => navigation.navigate("Home")}
            text="Finish"
          />
          <Spacer small />
        </ScrollView>
      </SafeAreaView>
    </ScreenCover>
  );
};

const mapStateToProps = state => ({
  address: getAddressSelector(state),
  addressSlp: getAddressSlpSelector(state),
  tokensById: tokensByIdSelector(state),
  spotPrices: spotPricesSelector(state)
});

const mapDispatchToProps = {
  updateUtxos,
  updateTransactions
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendSuccessScreen);
