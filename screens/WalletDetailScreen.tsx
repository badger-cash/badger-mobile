import React, { useState, useMemo } from "react";
import { connect, ConnectedProps } from "react-redux";
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
  View,
  Text
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import BigNumber from "bignumber.js";

import useBlockheight from "../hooks/useBlockheight";
import useSimpleledgerFormat from "../hooks/useSimpleledgerFormat";
import EyeOpenIcon from "../assets/images/eye-open.png";
import EyeClosedIcon from "../assets/images/eye-closed.png";

import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import {
  balancesSelector,
  transactionsActiveAccountSelector
} from "../data/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { isUpdatingTransactionsSelector } from "../data/transactions/selectors";
import { tokenBlacklistSelector } from "../data/settings/selectors";

import { Transaction } from "../data/transactions/reducer";

import {
  addTokenToBlacklist,
  removeTokenFromBlacklist
} from "../data/settings/actions";

import {
  formatAmount,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";

import { getTokenImage } from "../utils/token-utils";

import { T, H1, H2, Spacer, Button } from "../atoms";
import TransactionRow, {
  TransactionRowTypes
} from "../components/TransactionRow/TransactionRow";
import { FullState } from "../data/store";

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

const EyeIconImage = styled(Image)`
  width: 25;
  height: 25;
  overflow: hidden;
  left: 5;
`;

const VisibilityArea = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  right: 15;
  top: 10;
  position: absolute;
  align-items: center;
`;

const VisibilityText = styled(Text)`
  font-size: 9px;
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
`;

type PropsFromParent = NavigationScreenProps & {
  navigation: {
    state: {
      params: { tokenId?: string };
    };
  };
};

const mapStateToProps = (state: FullState, props: PropsFromParent) => {
  const tokenId = props.navigation.state.params.tokenId;

  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);

  const balances = balancesSelector(state, address);

  const tokensById = tokensByIdSelector(state);
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);
  const transactionsAll = transactionsActiveAccountSelector(state);
  const isUpdatingTransactions = isUpdatingTransactionsSelector(state);
  const tokenBlacklist = tokenBlacklistSelector(state);

  const transactions = transactionsAll
    .filter(tx => {
      const txTokenId =
        tx.txParams.sendTokenData && tx.txParams.sendTokenData.tokenId;

      if (tokenId) {
        return tokenId === txTokenId;
      }

      return !txTokenId || tx.txParams.valueBch;
    })
    .slice(0, 30);
  return {
    address,
    addressSlp,
    balances,
    tokensById,
    transactions,
    spotPrices,
    fiatCurrency,
    isUpdatingTransactions,
    tokenBlacklist
  };
};

const mapDispatchToProps = { addTokenToBlacklist, removeTokenFromBlacklist };

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const WalletDetailScreen = ({
  address,
  addressSlp,
  balances,
  navigation,
  tokensById,
  spotPrices,
  fiatCurrency,
  transactions,
  isUpdatingTransactions,
  tokenBlacklist,
  addTokenToBlacklist,
  removeTokenFromBlacklist
}: Props) => {
  const { tokenId } = navigation.state.params;
  const token = tokenId && tokensById[tokenId];

  if (!address || !addressSlp) {
    return null;
  }

  const simpleledgerAddressSlp = useSimpleledgerFormat(addressSlp);
  const simpleledgerAddress = useSimpleledgerFormat(address);

  const allOwnAddresses = useMemo(() => {
    return [
      address,
      addressSlp,
      simpleledgerAddress,
      simpleledgerAddressSlp
    ].filter(Boolean);
  }, [address, addressSlp, simpleledgerAddress, simpleledgerAddressSlp]);

  const [notifyCopyTokenId, setNotifyCopyTokenId] = useState(false);

  const blockheight = useBlockheight();

  const isBCH = !tokenId;

  const name = isBCH ? "Bitcoin Cash" : token ? token.name : "--------";
  const ticker = isBCH ? "BCH" : token ? token.symbol : "---";
  const decimals = !tokenId ? 8 : token ? token.decimals : null;
  const amount = isBCH
    ? balances.satoshisAvailable
    : tokenId
    ? balances.slpTokens[tokenId]
    : new BigNumber(0);

  const imageSource = useMemo(() => getTokenImage(tokenId), [tokenId]);

  let fiatAmount = null;
  let isBlacklisted = false;

  if (tokenId) {
    fiatAmount = computeFiatAmount(amount, spotPrices, fiatCurrency, tokenId);
    isBlacklisted = tokenBlacklist.includes(tokenId);
  } else {
    fiatAmount = computeFiatAmount(amount, spotPrices, fiatCurrency, "bch");
  }

  const fiatDisplay = isBCH
    ? formatFiatAmount(fiatAmount, fiatCurrency, tokenId || "bch")
    : null;

  const explorerUrl = isBCH
    ? `https://explorer.bitcoin.com/bch/address/${address}`
    : `https://explorer.bitcoin.com/bch/address/${simpleledgerAddressSlp}`;

  const amountFormatted = formatAmount(amount, decimals);

  let [amountWhole, amountDecimal] = (amountFormatted &&
    amountFormatted.split(".")) || [null, null];

  amountDecimal =
    amountDecimal && [...amountDecimal].every(v => v === "0")
      ? null
      : amountDecimal;

  type tokenProps = { tokenId: string };

  const HideButton = ({ tokenId }: tokenProps) => (
    <VisibilityArea>
      <VisibilityText
        onPress={() => {
          addTokenToBlacklist(tokenId);
        }}
      >
        Visible in Vault
      </VisibilityText>
      <EyeIconImage source={EyeOpenIcon} />
    </VisibilityArea>
  );

  const ShowButton = ({ tokenId }: tokenProps) => (
    <VisibilityArea>
      <VisibilityText
        onPress={() => {
          removeTokenFromBlacklist(tokenId);
        }}
      >
        Hidden from Vault
      </VisibilityText>
      <EyeIconImage source={EyeClosedIcon} />
    </VisibilityArea>
  );

  return (
    <SafeAreaView>
      <NavigationEvents
        onWillBlur={() => {
          setNotifyCopyTokenId(false);
        }}
      />
      <ScrollView
        style={{
          height: "100%"
        }}
      >
        <View>
          <Spacer small />
          {tokenId && isBlacklisted && <ShowButton tokenId={tokenId} />}
          {tokenId && !isBlacklisted && <HideButton tokenId={tokenId} />}

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
                navigation.navigate("RequestSetup", {
                  symbol: ticker,
                  tokenId
                })
              }
              text="Request"
            />
            <Button
              onPress={() =>
                navigation.navigate("SendSetup", {
                  tokenId
                })
              }
              text="Send"
            />
          </ButtonGroup>
          <Spacer />
        </View>
        <Spacer small />
        <T
          style={{
            marginLeft: 16,
            marginBottom: 5
          }}
          size="small"
          type="muted"
        >
          Transaction History (max 30)
        </T>
        <TransactionArea>
          {transactions.map((tx: Transaction) => {
            const { hash, txParams, time, block } = tx;
            const {
              to,
              from,
              toAddresses,
              fromAddresses,
              transactionType,
              value,
              valueBch,
              sendTokenData
            } = txParams;

            let txValue = tokenId
              ? sendTokenData && sendTokenData.valueToken
              : valueBch;

            if (txValue == null) {
              // Fallback to previous value parameter name
              txValue = value;
            }
            if (txValue == null) {
              // Fallback to no value
              txValue = 0;
            }

            let txType: TransactionRowTypes = "unrecognized";
            if (to && allOwnAddresses.includes(to)) {
              // Determine transaction type, consider moving this code to action.?
              if (from && allOwnAddresses.includes(from)) {
                txType = "interwallet";
              } else {
                if (toAddresses.length > 30) {
                  txType = "payout";
                } else {
                  txType = "receive";
                }
              }
            } else if (from && allOwnAddresses.includes(from)) {
              txType = "send";
            }

            const valueBigNumber = new BigNumber(txValue || 0);
            const valueAdjusted = tokenId
              ? valueBigNumber
              : valueBigNumber.shiftedBy(8 * -1);

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
          {isUpdatingTransactions && (
            <>
              <Spacer small />
              <T size="small" type="muted" center>
                Transaction history updating...
              </T>
              <T size="xsmall" type="muted2" center>
                This may take a few minutes.
              </T>
              <Spacer small />
            </>
          )}
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

export default connector(WalletDetailScreen);
