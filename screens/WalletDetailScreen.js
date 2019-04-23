// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { SafeAreaView, View, ScrollView, Image } from "react-native";
import makeBlockie from "ethereum-blockies-base64";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { transactionsByAccountSelector } from "../data/transactions/selectors";
import { updateTransactions } from "../data/transactions/actions";
import { type Transaction } from "../data/transactions/reducer";
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
  address: string,
  balances: Balances,
  navigation: { navigate: Function, state: { params: any } },
  tokensById: { [tokenId: string]: TokenData },
  updateTransactions: Function,
  transactions: Transaction[]
};

const WalletDetailScreen = ({
  address,
  addressSlp,
  balances,
  navigation,
  tokensById,
  transactions,
  updateTransactions
}: Props) => {
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

  // Update transaction history
  useEffect(() => {
    updateTransactions(address, addressSlp);
    const transactionInterval = setInterval(
      () => updateTransactions(address, addressSlp),
      15 * 1000
    );
    return () => clearInterval(transactionInterval);
  }, []);

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
          {transactions.map(tx => {
            const txType = tx.txParams.to === address ? "receive" : "send";
            return (
              <TransactionRow
                key={tx.hash}
                type={txType}
                timestamp={tx.time}
                toAddress={tx.txParams.to}
                fromAddress={tx.txParams.from}
                symbol={symbol}
                tokenId={tokenId}
                amount={
                  tokenId
                    ? tx.txParams.value
                    : formatAmount(tx.txParams.value, decimals)
                }
              />
            );
          })}
        </TransactionArea>
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const tokenId = props.navigation.state.params.tokenId;
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);

  const transactions = transactionsByAccountSelector(state, {
    address,
    tokenId
  });
  return {
    address,
    addressSlp,
    balances,
    tokensById,
    transactions
  };
};

const mapDispatchToProps = {
  updateTransactions
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletDetailScreen);
