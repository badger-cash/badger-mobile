// @flow

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { connect } from "react-redux";
import { NavigationEvents } from "react-navigation";
import styled from "styled-components";
import {
  Clipboard,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from "react-native";
import BigNumber from "bignumber.js";

import { getCurrentBlockheight } from "../api/rest.bitcoin";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import {
  balancesSelector,
  transactionsActiveAccountSelector,
  type Balances
} from "../data/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { type Transaction } from "../data/transactions/reducer";
import { type TokenData } from "../data/tokens/reducer";

import {
  formatAmount,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";
import { addressToSlp } from "../utils/account-utils";
import { getTokenImage } from "../utils/token-utils";
import { type CurrencyCode } from "../utils/currency-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";
import { TransactionRow } from "../components";

const TransactionArea = styled(View)`
  border-top-width: ${StyleSheet.hairlineWidth};
  border-top-color: ${props => props.theme.fg700};
  position: relative;
`;

const ButtonGroup = styled(View)`
  flex-direction: row;
  justify-content: space-around;
`;

const ExplorerRow = styled(View)`
  padding: 10px 16px;
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
  addressSlp: string,
  balances: Balances,
  spotPrices: any,
  fiatCurrency: CurrencyCode,
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
  spotPrices,
  fiatCurrency,
  transactions,
  updateTransactions
}: Props) => {
  const { tokenId } = navigation.state.params;
  const token = tokensById[tokenId];

  const [simpleledgerAddress, setSimpleledgerAddress] = useState(addressSlp);
  const [notifyCopyTokenId, setNotifyCopyTokenId] = useState(false);
  const [blockheight, setBlockheight] = useState(0);

  useEffect(() => {
    const updateBlockheight = async () => {
      try {
        const blockheightNow = await getCurrentBlockheight();
        setBlockheight(blockheightNow);
      } catch (e) {
        console.warn(e);
      }
    };

    updateBlockheight();
    const blockheightInterval = setInterval(updateBlockheight, 15 * 1000);

    return () => clearInterval(blockheightInterval);
  }, []);

  const convertToSimpleLedger = useCallback(async () => {
    const simpleLedger = await addressToSlp(addressSlp);
    setSimpleledgerAddress(simpleLedger);
    return simpleLedger;
  }, [addressSlp]);

  useEffect(() => {
    convertToSimpleLedger();
  }, [addressSlp]);

  const isBCH = !tokenId;

  const name = isBCH ? "Bitcoin Cash" : token ? token.name : "--------";
  const ticker = isBCH ? "BCH" : token ? token.symbol : "---";
  const decimals = isBCH ? 8 : token ? token.decimals : null;
  const amount = isBCH
    ? balances.satoshisAvailable
    : balances.slpTokens[tokenId];

  const imageSource = useMemo(() => getTokenImage(tokenId), [tokenId]);

  let fiatAmount = null;
  if (isBCH) {
    fiatAmount = computeFiatAmount(amount, spotPrices, fiatCurrency, "bch");
  } else {
    fiatAmount = computeFiatAmount(amount, spotPrices, fiatCurrency, tokenId);
  }
  const fiatDisplay = isBCH
    ? formatFiatAmount(fiatAmount, fiatCurrency, tokenId || "bch")
    : null;

  const explorerUrl = isBCH
    ? `https://explorer.bitcoin.com/bch/address/${address}`
    : `https://explorer.bitcoin.com/bch/address/${simpleledgerAddress}`;

  const amountFormatted = formatAmount(amount, decimals);
  let [amountWhole, amountDecimal] = (amountFormatted &&
    amountFormatted.split(".")) || [null, null];

  amountDecimal =
    amountDecimal && [...amountDecimal].every(v => v === "0")
      ? null
      : amountDecimal;

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={() => {
          setNotifyCopyTokenId(false);
        }}
      />
      <ScrollView style={{ height: "100%" }}>
        <View>
          <Spacer small />
          <H1 center>{name}</H1>
          {tokenId && (
            <TouchableOpacity
              onPress={() => {
                Clipboard.setString(tokenId);
                setNotifyCopyTokenId(true);
              }}
            >
              <T size="tiny" center>
                {tokenId}
              </T>
            </TouchableOpacity>
          )}
          {notifyCopyTokenId && (
            <>
              <Spacer minimal />
              <T center size="small" type="primary">
                Token ID copied to clipboard
              </T>
            </>
          )}
          <Spacer small />
          <IconArea>
            <IconImage source={imageSource} />
          </IconArea>

          <Spacer />
          <T center>Balance</T>
          <H1 center>
            {amountWhole}
            {amountDecimal ? <H2>.{amountDecimal}</H2> : null}
          </H1>
          {fiatDisplay && (
            <T center type="muted">
              {fiatDisplay}
            </T>
          )}
          <Spacer />
          <ButtonGroup>
            <Button
              onPress={() =>
                navigation.navigate("RequestSetup", { symbol: ticker, tokenId })
              }
              text="Request"
            />
            <Button
              onPress={() => navigation.navigate("SendSetup", { tokenId })}
              text="Send"
            />
          </ButtonGroup>
          <Spacer />
        </View>
        <Spacer small />
        <T
          style={{ marginLeft: 16, marginBottom: 5 }}
          size="small"
          type="muted"
        >
          Transaction History (max 30)
        </T>
        <TransactionArea>
          {transactions.map(tx => {
            const { hash, txParams, time, block } = tx;
            const {
              to,
              from,
              toAddresses,
              fromAddresses,
              transactionType,
              value
            } = txParams;

            let txType = null;
            // Determine transaction type, consider moving this code to action.?
            if ([address, addressSlp].includes(to)) {
              if ([address, addressSlp].includes(from)) {
                txType = "interwallet";
              } else {
                if (toAddresses.length > 30) {
                  txType = "payout";
                } else {
                  txType = "receive";
                }
              }
            } else if ([address, addressSlp].includes(from)) {
              txType = "send";
            } else {
              txType = "unrecognized";
            }

            const valueBigNumber = new BigNumber(value);
            const valueAdjusted = tokenId
              ? valueBigNumber
              : valueBigNumber.shiftedBy(decimals * -1);

            return (
              <TransactionRow
                confirmations={
                  block === 0
                    ? 0
                    : blockheight === 0
                    ? null
                    : blockheight - block + 1
                }
                key={hash}
                txId={hash}
                type={txType}
                timestamp={time}
                toAddress={to}
                toAddresses={toAddresses}
                fromAddresses={fromAddresses}
                fromAddress={from}
                symbol={ticker}
                tokenId={tokenId}
                amount={valueAdjusted.toString(10)}
              />
            );
          })}
          <ExplorerRow>
            <Spacer small />
            <T
              center
              type="muted2"
              onPress={() => Linking.openURL(explorerUrl)}
            >
              Full History
            </T>
            <Spacer small />
          </ExplorerRow>
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
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);

  const transactionsAll = transactionsActiveAccountSelector(state);

  const transactions = transactionsAll
    .filter(tx => {
      const txTokenId =
        tx.txParams.sendTokenData && tx.txParams.sendTokenData.tokenId;
      if (tokenId) {
        return tokenId === txTokenId;
      }
      return !txTokenId;
    })
    .slice(0, 30);

  return {
    address,
    addressSlp,
    balances,
    tokensById,
    transactions,
    spotPrices,
    fiatCurrency
  };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(WalletDetailScreen);
