// @flow

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { SafeAreaView, View, ScrollView } from "react-native";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { formatAmount } from "../utils/balance-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";

const TransactionArea = styled(View)`
  border-top-width: 1px;
  border-top-color: red;
`;

const ButtonGroup = styled(View)`
  flex-direction: row;
  justify-content: space-around;
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

  console.log("in wallet detail");
  const isBCH = symbol === "BCH" && !tokenId;

  const name = isBCH ? "Bitcoin Cash" : token.name;
  const ticker = isBCH ? "BCH" : token.symbol;
  const decimals = isBCH ? 8 : token.decimals;
  const amount = isBCH
    ? balances.satoshisAvailable
    : balances.slpTokens[tokenId];

  console.log(isBCH);

  // console.log(props);
  return (
    <SafeAreaView>
      <ScrollView>
        <View>
          <Spacer />
          <H2 center>{name}</H2>
          {/* <Spacer /> */}
          {/* <H2 center>${ticker}</H2> */}
          <H1 center>{formatAmount(amount, decimals)}</H1>
          <Spacer />
          <ButtonGroup>
            <Button onPress={() => console.log("1")}>
              <T>Send</T>
            </Button>
            <Button onPress={() => console.log("2")}>
              <T>Receive</T>
            </Button>
          </ButtonGroup>
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

const mapStateToProps = (state, props) => {
  const { symbol, tokenId } = props.navigation.state.params;
  console.log(symbol, tokenId);
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
