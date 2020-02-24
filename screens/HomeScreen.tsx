import React, { useEffect, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  SectionList,
  View,
  TouchableOpacity
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import uuidv5 from "uuid/v5";

import { T, H1, Spacer } from "../atoms";

import { CoinRowHeader, CoinRow } from "../components";

import { FullState } from "../data/store";
import { balancesSelector, Balances } from "../data/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector,
  getSeedViewedSelector
} from "../data/accounts/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";
import { doneInitialLoadSelector } from "../data/utxos/selectors";
import { tokenBlacklistSelector } from "../data/settings/selectors";

import { TokenData } from "../data/tokens/reducer";

import { updateTransactions } from "../data/transactions/actions";
import { updateUtxos } from "../data/utxos/actions";
import { updateTokensMeta } from "../data/tokens/actions";
import { updateSpotPrice } from "../data/prices/actions";

import {
  formatAmount,
  formatFiatAmount,
  computeFiatAmount
} from "../utils/balance-utils";

const SECOND = 1000;

// Same as the Badger namespace for now.  doesn't need to be unique here.
const HASH_UUID_NAMESPACE = "9fcd327c-41df-412f-ba45-3cc90970e680";

const BackupNotice = styled(TouchableOpacity)`
  border-color: ${props => props.theme.accent500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 4px;
  padding: 8px;
  background-color: ${props => props.theme.accent900};
  margin: 8px 16px;
`;

const NoTokensRow = styled(View)`
  padding: 10px 16px;
`;

const NoTokensFound = () => (
  <NoTokensRow>
    <T size="small" type="muted2">
      No SLP tokens in the vault yet
    </T>
  </NoTokensRow>
);

const InitialLoadCover = styled(View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  left: 0;
  background-color: ${props => props.theme.coverBg};
  height: 100%;
  width: 100%;
  z-index: 1;
  align-items: center;
  justify-content: center;
`;

type PropsFromParent = NavigationScreenProps & {};

const mapStateToProps = (state: FullState) => {
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);
  const spotPrices = spotPricesSelector(state);
  const seedViewed = getSeedViewedSelector(state);
  const initialLoadingDone = doneInitialLoadSelector(state, address);
  const fiatCurrency = currencySelector(state);
  const tokenBlacklist = tokenBlacklistSelector(state);

  return {
    address,
    addressSlp,
    seedViewed,
    balances,
    spotPrices,
    fiatCurrency,
    tokensById,
    initialLoadingDone,
    tokenBlacklist
  };
};

const mapDispatchToProps = {
  updateSpotPrice,
  updateTokensMeta,
  updateTransactions,
  updateUtxos
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & PropsFromParent;

interface WalletSection {
  title: string;
  data: {
    symbol: string;
    name: string;
    amount: string;
    tokenId?: string;
    valueDisplay?: string;
  }[];
}

const HomeScreen = ({
  address,
  addressSlp,
  balances,
  initialLoadingDone,
  navigation,
  seedViewed,
  spotPrices,
  fiatCurrency,
  tokensById,
  updateSpotPrice,
  updateTokensMeta,
  updateTransactions,
  updateUtxos,
  tokenBlacklist
}: Props) => {
  const [isShowingBlacklist, setIsRevealed] = useState(false);

  useEffect(() => {
    // Update UTXOs on an interval
    if (!address) return;
    updateUtxos(address, addressSlp);
    const utxoInterval = setInterval(
      () => updateUtxos(address, addressSlp),
      15 * SECOND
    );
    return () => {
      clearInterval(utxoInterval);
    };
  }, [address, addressSlp, updateUtxos]);

  useEffect(() => {
    // Update transaction history initial
    if (!address || !addressSlp) return;
    updateTransactions(address, addressSlp);
  }, [address, addressSlp, updateTransactions]);

  useEffect(() => {
    // Update transaction history interval
    const transactionInterval = setInterval(() => {
      updateTransactions(address, addressSlp);
    }, 30 * SECOND);
    return () => {
      clearInterval(transactionInterval);
    };
  }, [address, addressSlp, updateTransactions]);

  const tokenIds = Object.keys(balances.slpTokens);
  const tokenIdsHash = uuidv5(tokenIds.join(""), HASH_UUID_NAMESPACE);

  useEffect(() => {
    // Fetch token metadata if any are missing
    const missingTokenIds = tokenIds.filter(tokenId => !tokensById[tokenId]);
    updateTokensMeta(missingTokenIds);
  }, [tokenIdsHash]);

  useEffect(() => {
    // Update the BCH price on an interval
    updateSpotPrice(fiatCurrency);
    const spotPriceInterval = setInterval(
      () => updateSpotPrice(fiatCurrency),
      60 * SECOND
    );
    return () => clearInterval(spotPriceInterval);
  }, [fiatCurrency, updateSpotPrice]);

  const BCHFiatDisplay = useMemo(() => {
    const BCHFiatAmount = computeFiatAmount(
      balances.satoshisAvailable,
      spotPrices,
      fiatCurrency,
      "bch"
    );

    return formatFiatAmount(BCHFiatAmount, fiatCurrency, "bch");
  }, [balances.satoshisAvailable, fiatCurrency, spotPrices]);

  const tokenData = useMemo(() => {
    const slpTokensDisplay = Object.keys(balances.slpTokens).map<
      [string, BigNumber]
    >(key => [key, balances.slpTokens[key]]);

    const tokensWithBalance = slpTokensDisplay.filter(
      ([tokenId, amount]) => amount.toNumber() !== 0
    );
    const tokensFormatted = tokensWithBalance.map(([tokenId, amount]) => {
      const token = tokensById[tokenId];
      const symbol = token ? token.symbol : "---";
      const name = token ? token.name : "--------";
      const decimals = token ? token.decimals : null;
      const amountFormatted = formatAmount(amount, decimals);

      return {
        symbol,
        name,
        amount: amountFormatted,
        tokenId
      };
    });

    const tokensSorted = tokensFormatted.sort((a, b) => {
      const symbolA = a.symbol.toUpperCase();
      const symbolB = b.symbol.toUpperCase();
      if (symbolA < symbolB) return -1;
      if (symbolA > symbolB) return 1;
      return 0;
    });
    return tokensSorted;
  }, [balances.slpTokens, tokensById]);

  const blacklistSection: WalletSection[] = useMemo(() => {
    const filteredTokens = tokenData.filter(data =>
      tokenBlacklist.includes(data.tokenId)
    );
    return [
      {
        title: "Hidden Tokens",
        data: filteredTokens
      }
    ];
  }, [tokenData, tokenBlacklist]);

  const curatedSection: WalletSection = useMemo(() => {
    const filteredTokens = tokenData.filter(
      data => !tokenBlacklist.includes(data.tokenId)
    );
    return {
      title: "Simple Token Vault",
      data: filteredTokens
    };
  }, [tokenData, tokenBlacklist]);

  const walletSections: WalletSection[] = useMemo(() => {
    const sectionBCH: WalletSection = {
      title: "Bitcoin Cash Wallet",
      data: [
        {
          symbol: "BCH",
          name: "Bitcoin Cash",
          amount: formatAmount(balances.satoshisAvailable, 8),
          valueDisplay: BCHFiatDisplay
        }
      ]
    };

    const sectionSLP = curatedSection;

    return [sectionBCH, sectionSLP];
  }, [BCHFiatDisplay, balances.satoshisAvailable, tokenData]);

  const showBlacklist = tokenBlacklist.length >= 1;

  return (
    <SafeAreaView>
      <View
        style={{
          height: "100%"
        }}
      >
        <ScrollView
          style={{
            flex: 1
          }}
          contentContainerStyle={{
            flexGrow: 1
          }}
        >
          {!seedViewed ? (
            <>
              <BackupNotice
                onPress={() => navigation.navigate("ViewSeedPhrase")}
              >
                <T center size="small" type="accent">
                  Please backup your Seed Phrase
                </T>
              </BackupNotice>
              <Spacer small />
            </>
          ) : (
            <Spacer large />
          )}
          <H1 center spacing="loose" weight="bold">
            Badger
          </H1>
          <Spacer tiny />
          <T center type="muted2">
            BCH and SLP wallet
          </T>
          <Spacer />
          <View
            style={{
              position: "relative"
            }}
          >
            <SectionList
              sections={walletSections}
              renderSectionHeader={({ section }) => (
                <CoinRowHeader>{section.title}</CoinRowHeader>
              )}
              renderSectionFooter={({ section }) =>
                !section.data.length ? <NoTokensFound /> : null
              }
              renderItem={({ item }) =>
                item && (
                  <CoinRow
                    amount={item.amount}
                    name={item.name}
                    ticker={item.symbol}
                    tokenId={item.tokenId}
                    valueDisplay={item.valueDisplay}
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
            <Spacer />
            {showBlacklist && (
              <T center onPress={() => setIsRevealed(!isShowingBlacklist)}>
                {isShowingBlacklist ? "Collapse" : "Reveal"}{" "}
                {tokenBlacklist.length} hidden{" "}
                {tokenBlacklist.length > 1 ? "tokens" : "token"}
              </T>
            )}
            <Spacer />
            {isShowingBlacklist && (
              <SectionList
                sections={blacklistSection}
                renderItem={({ item }) =>
                  item && (
                    <CoinRow
                      amount={item.amount}
                      name={item.name}
                      ticker={item.symbol}
                      tokenId={item.tokenId}
                      valueDisplay={item.valueDisplay}
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
            )}

            {!initialLoadingDone && (
              <InitialLoadCover>
                <ActivityIndicator />
                <Spacer small />
                <T>Initial Setup...</T>
              </InitialLoadCover>
            )}
          </View>
          <Spacer small />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default connector(HomeScreen);
