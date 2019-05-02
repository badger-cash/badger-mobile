// @flow
import React, { useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
  View,
  Image
} from "react-native";

import makeBlockie from "ethereum-blockies-base64";
import Swipeable from "react-native-swipeable";
import Ionicons from "react-native-vector-icons/Ionicons";

import SLPSDK from "slp-sdk";

import BitcoinCashImage from "../assets/images/icon.png";
import { Button, T, H1, H2, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";
import { tokensByIdSelector } from "../data/tokens/selectors";

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
import { spotPricesSelector } from "../data/prices/selectors";

const SLP = new SLPSDK();

const SWIPEABLE_WIDTH_PERCENT = 78;

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

const SwipeButtonContainer = styled(View)`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 32px;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  align-self: center;
`;

const ButtonsContainer = styled(View)`
  align-items: center;
  /* justify-content: center; */
  /* margin-left: 10px;
  margin-right: 10px; */
`;

const SwipeContent = styled(View)`
  height: 64px;
  padding-right: 10px;
  align-items: flex-end;
  justify-content: center;
  background-color: ${props =>
    props.activated ? props.theme.success500 : props.theme.pending500};
`;

const SwipeMainContent = styled(View)`
  height: 64px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  background-color: ${props =>
    props.triggered ? props.theme.success500 : props.theme.primary500};
`;

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  utxos: any,
  keypair: any,
  spotPrices: any,
  activeAccount: any,
  navigation: {
    navigate: Function,
    goBack: Function,
    replace: Function,
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

const SendConfirmScreen = ({
  navigation,
  tokensById,
  activeAccount,
  utxos,
  keypair,
  spotPrices
}: Props) => {
  const [confirmSwipeActivated, setConfirmSwipeActivated] = useState(false);

  const [
    transactionState: "setup" | "signing" | "broadcasting" | "sent",
    setTransactionState
  ] = useState("setup");

  const { symbol, tokenId, sendAmount, toAddress } = (navigation.state &&
    navigation.state.params) || {
    symbol: null,
    tokenId: null,
    sendAmount: null,
    toAddress: ""
  };

  const decimals = tokenId ? tokensById[tokenId].decimals : 8;

  const sendAmountFormatted = parseFloat(sendAmount);

  // Convert BCH amount to satoshis
  // Send the entered token amount as is
  const sendAmountParam = tokenId
    ? sendAmountFormatted
    : Math.floor(sendAmountFormatted * 10 ** decimals);

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
    } catch (e) {
      throw new Error("Error sending transaction");
    }
    navigation.replace("SendSuccess", { txParams });
  };
  // Return to setup if any tx params are missing
  if (!symbol || (!tokenId && symbol !== "BCH") || !sendAmount || !toAddress) {
    navigation.navigate("SendSetup", { symbol, tokenId });
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
    ? spotPrices["bch"]["usd"].rate * (sendAmountParam / 10 ** 8)
    : 0;
  const fiatDisplay = isBCH
    ? spotPrices["bch"]["usd"].rate
      ? `$${BCHFiatAmount.toFixed(3)} USD`
      : "$ -.-- USD"
    : null;

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
        <H2 center>Sending</H2>
        <Spacer small />
        <H2 center>
          {sendAmountFormatted || "--"} {symbol}
        </H2>
        {fiatDisplay && (
          <T center type="muted2">
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
          <T style={{ fontWeight: "bold" }}>{addressStart}</T>
          <T size="small">{addressMiddle}</T>
          <T style={{ fontWeight: "bold" }}>{addressEnd}</T>
        </T>
        <Spacer fill />
        <Spacer small />

        <ButtonsContainer>
          <SwipeButtonContainer>
            {transactionState === "signing" ? (
              <ActivityIndicator size="large" />
            ) : (
              <Swipeable
                leftActionActivationDistance={
                  Dimensions.get("window").width *
                  (SWIPEABLE_WIDTH_PERCENT / 100) *
                  0.8
                }
                leftContent={
                  <SwipeContent activated={confirmSwipeActivated}>
                    {confirmSwipeActivated ? (
                      <T weight="bold" type="inverse">
                        Release to send
                      </T>
                    ) : (
                      <T weight="bold" type="inverse">
                        Keep pulling
                      </T>
                    )}
                  </SwipeContent>
                }
                onLeftActionActivate={() => setConfirmSwipeActivated(true)}
                onLeftActionDeactivate={() => setConfirmSwipeActivated(false)}
                onLeftActionComplete={() => signSendTransaction()}
              >
                <SwipeMainContent triggered={transactionState === "signing"}>
                  <T weight="bold" type="inverse">
                    Swipe{" "}
                  </T>
                  <T weight="bold" type="inverse" style={{ paddingTop: 2 }}>
                    <Ionicons name="ios-arrow-round-forward" size={25} />
                  </T>
                  <T weight="bold" type="inverse">
                    {" "}
                    To Send
                  </T>
                </SwipeMainContent>
              </Swipeable>
            )}
          </SwipeButtonContainer>
          <Spacer />
          {transactionState !== "signing" && (
            <Button
              nature="cautionGhost"
              text="Cancel Transaction"
              style={{ width: `${SWIPEABLE_WIDTH_PERCENT}%` }}
              onPress={() => navigation.goBack()}
            />
          )}
        </ButtonsContainer>
        <Spacer small />
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const tokensById = tokensByIdSelector(state);
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(state, activeAccount.address);
  const keypair = getKeypairSelector(state);
  const spotPrices = spotPricesSelector(state);

  return {
    activeAccount,
    keypair,
    spotPrices,
    tokensById,
    utxos
  };
};

export default connect(mapStateToProps)(SendConfirmScreen);
