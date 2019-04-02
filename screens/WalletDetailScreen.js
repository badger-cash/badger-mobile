// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { SafeAreaView, View, ScrollView, Image } from "react-native";
import makeBlockie from "ethereum-blockies-base64";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { formatAmount } from "../utils/balance-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";
import BitcoinCashImage from "../assets/images/icon.png";

const TransactionArea = styled(View)`
  border-top-width: 1px;
  border-top-color: red;
`;

const ButtonGroup = styled(View)`
  flex-direction: row;
  justify-content: space-around;
`;

const IconImage = styled(Image)`
  width: 56;
  height: 56;
  border-radius: 28;
  overflow: hidden;
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;

type Props = {
  navigation: any,
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
            <Button onPress={() => console.log("1")} text="Send" />

            {/* <Button onPress={() => console.log("2")} text="Receive" /> */}
          </ButtonGroup>
          <Spacer />
        </View>
        <TransactionArea>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
          <H2>transaction!</H2>
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
