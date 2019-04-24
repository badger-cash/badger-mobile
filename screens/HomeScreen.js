// @flow

import React, { useEffect } from "react";
import { SafeAreaView, ScrollView, SectionList } from "react-native";
import uuidv5 from "uuid/v5";

import { connect } from "react-redux";

import { T, H1, Spacer } from "../atoms";

import { CoinRowHeader, CoinRow } from "../components";

import { balancesSelector, type Balances } from "../data/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { type TokenData } from "../data/tokens/reducer";

import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";
import { updateTokensMeta } from "../data/tokens/actions";

import { formatAmount } from "../utils/balance-utils";

const SECOND = 1000;

// Same as the Badger namespace for now.  doesn't need to be unique here.
const HASH_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

type Props = {
  address: string,
  addressSlp: string,
  updateTransactions: Function,
  updateUtxos: Function,
  updateTokensMeta: Function,
  balances: Balances,
  tokensById: { [tokenId: string]: TokenData },
  navigation: { navigate: Function }
};

const HomeScreen = ({
  address,
  addressSlp,
  updateTransactions,
  updateUtxos,
  updateTokensMeta,
  tokensById,
  balances,
  navigation
}: Props) => {
  useEffect(() => {
    // Update UTXOs on an interval
    updateUtxos(address, addressSlp);
    const utxointerval = setInterval(
      () => updateUtxos(address, addressSlp),
      10 * SECOND
    );
    return () => clearInterval(utxointerval);
  }, [address]);

  // Update transaction history
  useEffect(() => {
    updateTransactions(address, addressSlp);
    const transactionInterval = setInterval(
      () => updateTransactions(address, addressSlp),
      15 * 1000
    );
    return () => clearInterval(transactionInterval);
  }, []);

  const tokenIds = Object.keys(balances.slpTokens);
  const tokenIdsHash = uuidv5(tokenIds.join(""), HASH_UUID_NAMESPACE);

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = tokenIds.filter(tokenId => !tokensById[tokenId]);
    updateTokensMeta(missingTokenIds);
  }, [tokenIdsHash]);

  const slpTokens = balances.slpTokens;

  //[[tokenId, amount]]
  const slpTokensDisplay = Object.keys(slpTokens).map(key => [
    key,
    slpTokens[key]
  ]);

  // console.log(addressSlp);
  // console.log(address);
  // console.log(tokensById)

  const tokenData = slpTokensDisplay
    .map(([tokenId, amount]) => {
      const symbol = tokensById[tokenId] ? tokensById[tokenId].symbol : "---";
      const name = tokensById[tokenId] ? tokensById[tokenId].name : "--------";
      const decimals = tokensById[tokenId]
        ? tokensById[tokenId].decimals
        : null;
      const amountFormatted = formatAmount(amount, decimals);
      return {
        symbol,
        name,
        amount: amountFormatted,
        extra: "Simple Token",
        tokenId
      };
    })
    .sort((a, b) => {
      const symbolA = a.symbol.toUpperCase();
      const symbolB = b.symbol.toUpperCase();
      if (symbolA < symbolB) return -1;
      if (symbolA > symbolB) return 1;
      return 0;
    });

  const walletSections = [
    {
      title: "Bitcoin Cash Wallet",
      data: [
        {
          symbol: "BCH",
          name: "Bitcoin Cash",
          amount: formatAmount(balances.satoshisAvailable, 8)
        }
      ]
    },
    {
      title: "Simple Token Vault",
      data: tokenData
    }
  ];

  return (
    <SafeAreaView>
      <ScrollView>
        <Spacer small />
        <H1 center>Badger Mobile</H1>
        <Spacer small />
        <SectionList
          sections={walletSections}
          renderSectionHeader={({ section }) => (
            <CoinRowHeader>{section.title}</CoinRowHeader>
          )}
          renderItem={({ item }) =>
            item && (
              <CoinRow
                ticker={item.symbol}
                name={item.name}
                amount={item.amount}
                extra={item.extra}
                tokenId={item.tokenId}
                onPress={() =>
                  navigation.navigate("WalletDetailScreen", {
                    symbol: item.symbol,
                    tokenId: item.tokenId
                  })
                }
              />
            )
          }
          keyExtractor={(item, index) => `${index}`}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);

  const tokensById = tokensByIdSelector(state);

  return {
    address,
    addressSlp,
    balances,
    tokensById
  };
};
const mapDispatchToProps = {
  updateTransactions,
  updateUtxos,
  updateTokensMeta
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
