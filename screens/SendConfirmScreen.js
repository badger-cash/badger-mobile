// @flow
import React, { useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { Dimensions, SafeAreaView, View, Image } from "react-native";

import makeBlockie from "ethereum-blockies-base64";
import Swipeable from "react-native-swipeable";
import Ionicons from "react-native-vector-icons/Ionicons";

import BitcoinCashImage from "../assets/images/icon.png";
import { Button, T, H1, H2, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";
import { tokensByIdSelector } from "../data/tokens/selectors";

import {
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction
} from "../utils/transaction-utils";

import {
  getKeypairSelector,
  activeAccountSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";

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
  border-radius: 30px;
  width: 75%;
  align-self: center;
`;

const SwipeContent = styled(View)`
  height: 60px;
  padding-right: 10px;
  align-items: flex-end;
  justify-content: center;
  background-color: ${props =>
    props.activated ? props.theme.success500 : props.theme.pending500};
`;

const SwipeMainContent = styled(View)`
  height: 60px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  background-color: ${props =>
    props.triggered ? props.theme.success500 : props.theme.primary400};
`;

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  utxos: any,
  keypair: any,
  activeAccount: any,
  navigation: {
    navigate: Function,
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
  keypair
}: Props) => {
  const [confirmSwipeActivated, setConfirmSwipeActivated] = useState(false);

  // TODO - Consider moving this into redux
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

    const spendableUTXOS = utxos.filter(utxo => utxo.spendable);

    let txParams = {};
    try {
      if (tokenId) {
        const spendableTokenUtxos = utxos.filter(utxo => {
          return (
            utxo.slp &&
            utxo.slp.baton === false &&
            utxo.validSlpTx === true &&
            utxo.slp.token === tokenId
          );
        });
        // Sign and send SLP Token tx
        txParams = {
          to: toAddress,
          from: activeAccount.addressSlp,
          value: sendAmountParam,
          sendTokenData: { tokenId }
        };

        console.log("txParams");
        console.log(txParams);
        console.log(spendableTokenUtxos);
        await signAndPublishSlpTransaction(
          txParams,
          keypair,
          spendableUTXOS,
          {
            decimals
          },
          spendableTokenUtxos
        );
      } else {
        // Sign and send BCH tx
        txParams = {
          to: toAddress,
          from: activeAccount.address,
          value: sendAmountParam
        };

        await signAndPublishBchTransaction(txParams, keypair, spendableUTXOS);
      }
    } catch (e) {
      throw new Error("Error sending transaction");
    }
    navigation.navigate("SendSuccess", { txParams });
  };
  // Return to setup if any tx params are missing
  if (!symbol || (!tokenId && symbol !== "BCH") || !sendAmount || !toAddress) {
    navigation.navigate("SendSetup", { symbol, tokenId });
  }

  const imageSource =
    symbol === "BCH" && !tokenId
      ? BitcoinCashImage
      : { uri: makeBlockie(tokenId) };

  const coinName =
    symbol === "BCH" && !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  // toAddress like
  // -> simpleledger:qq2addressHash
  // -> l344f3legacyFormatted
  const addressParts = toAddress.split(":");
  const address = addressParts.length === 2 ? addressParts[1] : addressParts[0];
  const protocol = addressParts.length === 2 ? addressParts[0] : "legacy";

  const addressStart = address.slice(0, 5);
  const addressMiddle = address.slice(5, -6);
  const addressEnd = address.slice(-6);

  return (
    <SafeAreaView>
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
      <H2 center>Sending Amount</H2>
      <Spacer small />
      <H2 center>
        {sendAmount} {symbol}
      </H2>
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
      <Spacer />
      <Spacer />

      <SwipeButtonContainer>
        <Swipeable
          leftActionActivationDistance={
            Dimensions.get("window").width * 0.75 * 0.8
          }
          leftContent={
            <SwipeContent activated={confirmSwipeActivated}>
              {confirmSwipeActivated ? (
                <T type="inverse">Release to send</T>
              ) : (
                <T type="inverse">Keep pulling</T>
              )}
            </SwipeContent>
          }
          onLeftActionActivate={() => setConfirmSwipeActivated(true)}
          onLeftActionDeactivate={() => setConfirmSwipeActivated(false)}
          onLeftActionComplete={() => signSendTransaction()}
        >
          <SwipeMainContent triggered={transactionState === "signing"}>
            <T type="inverse">Swipe </T>
            <T type="inverse" style={{ paddingTop: 2 }}>
              <Ionicons name="ios-arrow-round-forward" size={25} />
            </T>
            <T type="inverse"> To Send</T>
          </SwipeMainContent>
        </Swipeable>
      </SwipeButtonContainer>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const tokensById = tokensByIdSelector(state);
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(state, activeAccount.address);
  const keypair = getKeypairSelector(state);

  return {
    activeAccount,
    tokensById,
    keypair,
    utxos
  };
};

export default connect(mapStateToProps)(SendConfirmScreen);
