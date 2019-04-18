// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { SafeAreaView, View, ScrollView, Image } from "react-native";
import makeBlockie from "ethereum-blockies-base64";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { type TokenData } from "../data/tokens/reducer";

import { formatAmount } from "../utils/balance-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";
import { TransactionRow } from "../components";

import BitcoinCashImage from "../assets/images/icon.png";

const TransactionArea = styled(View)`
  border-top-width: 1px;
  border-top-color: ${props => props.theme.fg700};
  position: relative;
`;

const IncompleteCover = styled(View)`
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 1;
  justify-content: center;
  align-items: center;
`;

const ButtonGroup = styled(View)`
  flex-direction: row;
  justify-content: space-around;
`;

const IconImage = styled(Image)`
  width: 64;
  height: 64;
  border-radius: 32;
  overflow: hidden;
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;

type Props = {
  navigation: { navigate: Function, state: { params: any } },
  balances: Balances,
  address: string,
  tokensById: { [tokenId: string]: TokenData }
};

const WalletDetailScreen = ({ balances, navigation, tokensById }: Props) => {
  const { symbol, tokenId } = navigation.state.params;
  const token = tokensById[tokenId];

  const isBCH = symbol === "BCH" && !tokenId;

  const name = isBCH ? "Bitcoin Cash" : token.name;
  const ticker = isBCH ? "BCH" : token.symbol;
  const decimals = isBCH ? 8 : token.decimals;
  const amount = isBCH
    ? balances.satoshisAvailable
    : balances.slpTokens[tokenId];

  const imageSource =
    ticker === "BCH" ? BitcoinCashImage : { uri: makeBlockie(tokenId) };

  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Spacer small />
          <IconArea>
            <IconImage source={imageSource} />
          </IconArea>
          <Spacer small />
          <H2 center>{name}</H2>
          <H1 center>{formatAmount(amount, decimals)}</H1>
          <Spacer small />
          <ButtonGroup>
            <Button
              onPress={() =>
                navigation.navigate("SendSetup", { symbol, tokenId })
              }
              text="Send"
            />
          </ButtonGroup>
          <Spacer />
        </View>
        <Spacer small />
        <T style={{ marginLeft: 7, marginBottom: 5 }} size="small" type="muted">
          Transaction History
        </T>
        <TransactionArea>
          <IncompleteCover>
            <T type="muted">Transaction history coming soon</T>
          </IncompleteCover>
          <TransactionRow
            type="send"
            timestamp={1554410212312}
            toAddress="bitcoincash:qrwt7l9k5gm9u0gw26rxvzeglvtgc5zehy85pupqv2"
            fromAddress="bitcoincash:qrwt7l9k5gm9u0gw26rxvzeglvtgc5zehy85pupqv2"
            symbol={symbol}
            tokenId={tokenId}
            amount={123.313}
          />
          <TransactionRow
            type="receive"
            timestamp={1554410112312}
            toAddress="bitcoincash:qrwt7l9k5gm9u0gw26rxvzeglvtgc5zehy85pupqv2"
            fromAddress="bitcoincash:qrwt7l9k5gm9u0gw26rxvzeglvtgc5zehy85pupqv2"
            symbol={symbol}
            tokenId={tokenId}
            amount={0.001}
          />
        </TransactionArea>
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const address = getAddressSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);
  return {
    balances,
    tokensById
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletDetailScreen);
