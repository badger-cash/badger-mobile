// @flow
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { SafeAreaView, View, Image } from "react-native";

import makeBlockie from "ethereum-blockies-base64";

import BitcoinCashImage from "../assets/images/icon.png";
import { Button, T, H1, H2, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";
import { tokensByIdSelector } from "../data/tokens/selectors";

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;
const IconImage = styled(Image)`
  width: 48;
  height: 48;
  border-radius: 24;
  overflow: hidden;
`;

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  navigation: {
    navigate: Function,
    state?: {
      params: {
        symbol: string,
        tokenId: ?string,
        sendAmount: string,
        toAddress: string
      }
    }
  }
};

const SendConfirmScreen = ({ navigation, tokensById }: Props) => {
  const { symbol, tokenId, sendAmount, toAddress } = (navigation.state &&
    navigation.state.params) || {
    symbol: null,
    tokenId: null,
    sendAmount: null,
    toAddress: null
  };

  if (!symbol || (!tokenId && symbol !== "BCH") || !sendAmount || !toAddress) {
    navigation.navigate("SendSetup", { symbol, tokenId });
  }

  const imageSource =
    symbol === "BCH" && !tokenId
      ? BitcoinCashImage
      : { uri: makeBlockie(tokenId) };

  const coinName =
    symbol === "BCH" && !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  // toAddress like
  // -> simpleledger:qq2addressHash
  // -> l344f3legacyFormatted
  const addressParts = toAddress.split(":");
  const address = addressParts.length === 2 ? addressParts[1] : addressParts[0];
  const protocol = addressParts.length === 2 ? addressParts[0] : "legacy";

  const addressStart = address.slice(0, 5);
  const addressMiddle = address.slice(5, -5);
  const addressEnd = address.slice(-5);

  return (
    <SafeAreaView>
      <Spacer />
      <H1 center>Confirm Transaction</H1>
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
      <H2 center>Sending Amount</H2>
      <Spacer small />
      <H2 center>
        {sendAmount} {symbol}
      </H2>
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
      <Spacer />
      <Button
        onPress={() => console.log("send confirm")}
        text="Confirm Transaction"
      />
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const tokensById = tokensByIdSelector(state);
  return {
    tokensById
  };
};

export default connect(mapStateToProps)(SendConfirmScreen);
