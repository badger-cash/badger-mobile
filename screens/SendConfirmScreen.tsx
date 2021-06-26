import React, { useState } from "react";
import { connect, ConnectedProps, Connect } from "react-redux";
import styled from "styled-components";
import {
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Switch,
  View,
  Image
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import BigNumber from "bignumber.js";

import { Button, T, H1, H2, Spacer, SwipeButton } from "../atoms";

import { tokensByIdSelector } from "../data/tokens/selectors";

import { formatFiatAmount } from "../utils/balance-utils";

import {
  signAndPublishBchTransaction,
  signAndPublishSlpTransaction,
  TxParams
} from "../utils/transaction-utils";

import { getTokenImage } from "../utils/token-utils";

import {
  getKeypairSelector,
  activeAccountSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";

import { SLP } from "../utils/slp-sdk-utils";
import { FullState } from "../data/store";

import { getPostageRates } from "../api/pay.badger";

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

const PostOfficeArea = styled(View)`
  margin: 0 60px;
  flex-direction: row;
  justify-content: space-between;
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

type PropsFromParent = NavigationScreenProps & {
  route: {
    params: {
      tokenId: string | null | undefined;
      sendAmount?: string;
      toAddress: string;
    };
  };
};

const mapStateToProps = (state: FullState) => {
  const tokensById = tokensByIdSelector(state);
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(
    state,
    activeAccount && activeAccount.address
  );
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

const mapDispatchToProps = {};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const SendConfirmScreen = ({
  navigation,
  route,
  tokensById,
  activeAccount,
  utxos,
  fiatCurrency,
  keypair,
  spotPrices
}: Props) => {
  if (!activeAccount || !keypair) {
    navigation.goBack();
    // return <View></View>;
  }

  const [sendError, setSendError] = useState<{
    message?: string;
    error?: string;
  } | null>(null);

  const [transactionState, setTransactionState] = useState("setup");

  const { tokenId, sendAmount, toAddress } = route.params || {
    tokenId: null,
    sendAmount: undefined,
    toAddress: ""
  };

  const displaySymbol = tokenId
    ? tokensById[tokenId]
      ? tokensById[tokenId].symbol
      : "---"
    : "BCH";

  const decimals = tokenId ? tokensById[tokenId].decimals : 8;

  const sendAmountBase = sendAmount
    ? new BigNumber(sendAmount)
    : new BigNumber(0);

  // Convert BCH amount to satoshis
  // Send the entered token amount as is
  const sendAmountAdjusted = tokenId
    ? sendAmountBase
    : sendAmountBase.shiftedBy(decimals).integerValue(BigNumber.ROUND_FLOOR);

  const sendAmountParam = sendAmountAdjusted.toString();

  const signSendTransaction = async () => {
    setTransactionState("signing");

    const utxoWithKeypair = utxos.map(utxo => ({
      ...utxo,
      keypair:
        utxo.address === activeAccount.address ? keypair.bch : keypair.slp
    }));

    const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);

    let txParams = {} as TxParams;

    try {
      if (tokenId) {
        // Sign and send SLP Token tx
        const spendableTokenUtxos = utxoWithKeypair.filter(utxo => {
          return (
            utxo.slp &&
            utxo.slp.baton === false &&
            utxo.validSlpTx === true &&
            utxo.slp.token === tokenId
          );
        });
        txParams = {
          to: SLP.Address.toCashAddress(toAddress),
          from: activeAccount.address,
          value: sendAmountParam,
          sendTokenData: {
            tokenId
          }
        };

        if (usePostOffice && postOfficeData && postOfficeData !== true)
          txParams.postOfficeData = postOfficeData;

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

      navigation.replace("SendSuccess", {
        txParams
      });
    } catch (e) {
      setTransactionState("setup");
      setSendError(e);
    }
  };

  if ((!tokenId && displaySymbol !== "BCH") || !sendAmount || !toAddress) {
    // Return to setup if any tx params are missing
    navigation.navigate("SendSetup", {
      tokenId
    });
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

  const BCHPrices = spotPrices["bch"];
  let BCHFiatAmount = 0;
  if (isBCH) {
    const fiatInfo = BCHPrices[fiatCurrency];
    const fiatRate = fiatInfo && fiatInfo.rate;
    if (fiatRate) {
      BCHFiatAmount =
        fiatRate * sendAmountAdjusted.dividedBy(10 ** 8).toNumber();
    }
  }

  const fiatDisplay = isBCH
    ? formatFiatAmount(
        new BigNumber(BCHFiatAmount),
        fiatCurrency,
        tokenId || "bch"
      )
    : null;

  const postageInfo = () => {
    // Postage Protocol is not available for BCH transactions
    if (!tokenId) return [false, null];

    const [result, setResult] = React.useState(null);
    const [available, setAvailable] = React.useState(false);

    React.useEffect(() => {
      const fetchPostageData = async () => {
        try {
          let postageInfo = await getPostageRates();
          const availableStamps = postageInfo.stamps;

          for (let i = 0; i < availableStamps.length; i++) {
            let stamp = availableStamps[i];
            if (stamp.tokenId == tokenId) {
              // Only include the stamp that is available
              stamp.rateDecimal = (stamp.rate / 10 ** stamp.decimals).toFixed(
                3
              );
              stamp.feePerByte = (
                stamp.rateDecimal / postageInfo.weight
              ).toFixed(3);
              postageInfo.stamps = [stamp];
              setResult(postageInfo);
              // Enable use of post office
              setAvailable(true);
            }
          }
        } catch (error) {
          setResult(null);
        }
        setshowSwipe(true);
      };

      fetchPostageData();
    }, []); // Empty array ensures this runs only once

    return [available, result];
  };

  const [postOfficeAvailable, postOfficeData] = postageInfo();
  const [usePostOffice, setUsePostOffice] = useState(false);
  const toggleSwitch = () => setUsePostOffice(previousState => !previousState);

  const [showSwipe, setshowSwipe] = useState(tokenId ? false : true);

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1
        }}
      >
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
          {sendAmountBase.toFormat() || "--"} {displaySymbol}
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

        {postOfficeAvailable && <Spacer medium />}
        {postOfficeAvailable && (
          <PostOfficeArea>
            <T weight="bold">Use Post Office?</T>
            <Switch
              trackColor={{ false: "#767577", true: "#11a87e" }}
              thumbColor={usePostOffice ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={toggleSwitch}
              value={usePostOffice}
            />
          </PostOfficeArea>
        )}
        {usePostOffice && postOfficeData && (
          <T size="small" center>
            Fee Rate: {postOfficeData.stamps[0].rateDecimal}{" "}
            {postOfficeData.stamps[0].symbol} per each {postOfficeData.weight}{" "}
            bytes
          </T>
        )}
        <Spacer small />

        {!showSwipe && <ActivityIndicator size="large" color="#11a87e" />}

        {sendError && (
          <ErrorHolder>
            <T center type="danger">
              {sendError.message || sendError.error}
            </T>
          </ErrorHolder>
        )}
        <Spacer fill />
        <Spacer small />

        {showSwipe && (
          <ButtonsContainer>
            <SwipeButton
              swipeFn={() => signSendTransaction()}
              labelAction="To Send"
              labelRelease="Release to send"
              labelHalfway="Keep going"
              controlledState={
                transactionState === "signing" ? "pending" : undefined
              }
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
        )}
        <Spacer small />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default connector(SendConfirmScreen);
