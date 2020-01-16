// @flow
import React, { useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  ScrollView,
  SafeAreaView,
  StyleSheet,
  View,
  Image
} from "react-native";
import BigNumber from "bignumber.js";

import { Button, T, H1, H2, Spacer, SwipeButton } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { type UTXO } from "../data/utxos/reducer";
import { type ECPair } from "../data/accounts/reducer";

import { formatFiatAmount } from "../utils/balance-utils";

import { type CurrencyCode } from "../utils/currency-utils";

import {
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction
} from "../utils/transaction-utils";

import { getTokenImage } from "../utils/token-utils";

import {
  getKeypairSelector,
  activeAccountSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";

import { SLP } from "../utils/slp-sdk-utils";

const ScreenWrapper = styled(SafeAreaView)`
  height: 100%;
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

const ButtonsContainer = styled(View)`
  align-items: center;
`;

const ErrorHolder = styled(View)`
  margin: 0 16px;
  padding: 8px;
  background-color: ${props => props.theme.danger700};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 3px;
  border-color: ${props => props.theme.danger300};
`;

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  utxos: UTXO[],
  keypair: { bch: ECPair, slp: ECPair },
  spotPrices: any,
  fiatCurrency: CurrencyCode,
  activeAccount: any,
  navigation: {
    navigate: Function,
    goBack: Function,
    replace: Function,
    state?: {
      params: {
        tokenId: ?string,
        sendAmount: string,
        toAddress: string
      }
    }
  }
};

const SendConfirmScreen = ({
  navigation,
  tokensById,
  activeAccount,
  utxos,
  fiatCurrency,
  keypair,
  spotPrices
}: Props) => {
  const [sendError, setSendError] = useState(null);

  const [
    transactionState: "setup" | "signing" | "broadcasting" | "sent",
    setTransactionState
  ] = useState("setup");

  const { tokenId, sendAmount, toAddress } = (navigation.state &&
    navigation.state.params) || {
    tokenId: null,
    sendAmount: null,
    toAddress: ""
  };

  const displaySymbol = tokenId
    ? tokensById[tokenId]
      ? tokensById[tokenId].symbol
      : "---"
    : "BCH";

  const decimals = tokenId ? tokensById[tokenId].decimals : 8;

  const sendAmountFormatted = new BigNumber(sendAmount);

  // Convert BCH amount to satoshis
  // Send the entered token amount as is
  const sendAmountAdjusted = tokenId
    ? sendAmountFormatted
    : sendAmountFormatted
        .shiftedBy(decimals)
        .integerValue(BigNumber.ROUND_FLOOR);

  const sendAmountParam = sendAmountAdjusted.toString();

  const signSendTransaction = async () => {
    setTransactionState("signing");

    const utxoWithKeypair = utxos.map(utxo => ({
      ...utxo,
      keypair:
        utxo.address === activeAccount.address ? keypair.bch : keypair.slp
    }));

    const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);

    let txParams = {};
    try {
      if (tokenId) {
        const spendableTokenUtxos = utxoWithKeypair.filter(utxo => {
          return (
            utxo.slp &&
            utxo.slp.baton === false &&
            utxo.validSlpTx === true &&
            utxo.slp.token === tokenId
          );
        });
        // Sign and send SLP Token tx
        txParams = {
          to: SLP.Address.toCashAddress(toAddress),
          from: activeAccount.address,
          value: sendAmountParam,
          sendTokenData: { tokenId }
        };

        await signAndPublishSlpTransaction(
          txParams,
          spendableUTXOS,
          {
            decimals
          },
          spendableTokenUtxos,
          activeAccount.addressSlp
        );
      } else {
        // Sign and send BCH tx
        txParams = {
          to: toAddress,
          from: activeAccount.address,
          value: sendAmountParam
        };

        await signAndPublishBchTransaction(txParams, spendableUTXOS);
      }
      navigation.replace("SendSuccess", { txParams });
    } catch (e) {
      setTransactionState("setup");

      // Probably can remove as error formatted comes back differently now
      const errorFormatted =
        {
          "66: insufficient priority": new Error(
            "SLP transactions require a small amount of BCH to pay the transaction fee.  Please add a small amount of BCH to your wallet and try again"
          )
        }[e.error] || e;

      setSendError(errorFormatted);
    }
  };
  // Return to setup if any tx params are missing
  if ((!tokenId && displaySymbol !== "BCH") || !sendAmount || !toAddress) {
    navigation.navigate("SendSetup", { tokenId });
  }

  const imageSource = getTokenImage(tokenId);

  const coinName = !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  // toAddress like
  // -> simpleledger:qq2addressHash
  // -> l344f3legacyFormatted
  const addressParts = toAddress.split(":");
  const address = addressParts.length === 2 ? addressParts[1] : addressParts[0];
  const protocol = addressParts.length === 2 ? addressParts[0] : "legacy";

  const addressStart = address.slice(0, 5);
  const addressMiddle = address.slice(5, -6);
  const addressEnd = address.slice(-6);

  const isBCH = !tokenId;
  const BCHFiatAmount = isBCH
    ? spotPrices["bch"][fiatCurrency].rate * (sendAmountParam / 10 ** 8)
    : 0;
  const fiatDisplay = isBCH
    ? formatFiatAmount(
        new BigNumber(BCHFiatAmount),
        fiatCurrency,
        tokenId || "bch"
      )
    : null;

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Spacer small />
        <H1 center>{coinName}</H1>
        {tokenId && (
          <T size="tiny" center>
            {tokenId}
          </T>
        )}
        <Spacer small />
        <IconArea>
          <IconImage source={imageSource} />
        </IconArea>

        <Spacer />
        <H2 center>Sending</H2>
        <Spacer small />
        <H2 center weight="bold">
          {sendAmountFormatted.toFormat() || "--"} {displaySymbol}
        </H2>
        {fiatDisplay && (
          <T center type="muted">
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
          <T weight="bold">{addressStart}</T>
          <T size="small">{addressMiddle}</T>
          <T weight="bold">{addressEnd}</T>
        </T>
        <Spacer small />
        {sendError && (
          <ErrorHolder>
            <T center type="danger">
              {sendError.message || sendError.error}
            </T>
          </ErrorHolder>
        )}
        <Spacer fill />
        <Spacer small />

        <ButtonsContainer>
          <SwipeButton
            swipeFn={() => signSendTransaction()}
            labelAction="To Send"
            labelRelease="Release to send"
            labelHalfway="Keep going"
            controlledState={transactionState === "signing" ? "pending" : null}
          />

          <Spacer />
          {transactionState !== "signing" && (
            <Button
              nature="cautionGhost"
              text="Cancel Transaction"
              onPress={() => navigation.goBack()}
            />
          )}
        </ButtonsContainer>
        <Spacer small />
      </ScrollView>
    </ScreenWrapper>
  );
};

const mapStateToProps = state => {
  const tokensById = tokensByIdSelector(state);
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(state, activeAccount.address);
  const keypair = getKeypairSelector(state);
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);

  return {
    activeAccount,
    keypair,
    spotPrices,
    fiatCurrency,
    tokensById,
    utxos
  };
};

export default connect(mapStateToProps)(SendConfirmScreen);
