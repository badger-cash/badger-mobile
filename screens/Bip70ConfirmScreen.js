// TODO -

// - Show the BIP70 details here + countdown
// - Swipe to send BIP70 payment
// - Work on SLP BIP70
// - LOTS of testing
// - Confirm screen updates for this payment type.

// @flow
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  ActivityIndicator,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StyleSheet,
  View,
  Image
} from "react-native";
import BigNumber from "bignumber.js";

import Swipeable from "react-native-swipeable";
import Ionicons from "react-native-vector-icons/Ionicons";

import { Button, T, H1, H2, Spacer } from "../atoms";

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
import {
  decodePaymentRequest,
  getAsArrayBuffer,
  type PaymentRequest
} from "../utils/bip70-utils";

const SWIPEABLE_WIDTH_PERCENT = 78;

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

const SwipeButtonContainer = styled(View)`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 32px;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  align-self: center;
  border-width: 2px;
  border-color: ${props => props.theme.primary700};
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

const FullView = styled(View)`
  flex: 1;
  justify-content: center;
  padding: 0 16px;
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
    state: {
      params: {
        tokenId: ?string,
        sendAmount: string,
        toAddress: string,
        paymentURL: string
      }
    }
  }
};

const Bip70ConfirmScreen = ({
  navigation,
  tokensById,
  activeAccount,
  utxos,
  fiatCurrency,
  keypair,
  spotPrices
}: Props) => {
  // Props / state variables
  const { paymentURL } = navigation.state && navigation.state.params;

  if (!paymentURL) {
    console.warn("No BIP70 payment URL found, returning to previous screen");
    navigation.goBack();
  }

  // Setup state hooks
  const [confirmSwipeActivated, setConfirmSwipeActivated] = useState(false); // Consider moving Swipe + state to own component, used in 3 places now.
  const [sendError, setSendError] = useState(null);
  const [tickTime: number, setTickTime] = useState(Date.now());

  const [paymentDetails: ?PaymentRequest, setPaymentDetails] = useState(null);

  const [tokenId, setTokenId] = useState(null);
  const [paymentAmountCrypto: ?BigNumber, setPaymentAmountCrypto] = useState(
    null
  ); // maybe not needed, can get from payment details?
  const [paymentAmountFiat: ?number, setPaymentAmountFiat] = useState(null);

  const [
    step:
      | "fetching"
      | "review"
      | "creating"
      | "sending"
      | "confirmed"
      | "error"
      | "invalid",
    setStep
  ] = useState("fetching");

  // Setup effect hooks
  useEffect(() => {
    // Fetch payment details on initial load
    setStep("fetching");
    const fetchDetails = async () => {
      let headers = {
        Accept: "application/bitcoincash-paymentrequest",
        "Content-Type": "application/octet-stream"
      };

      // Assume BCH, but fail over to SLP
      let paymentResponse;
      let paymentRequest;
      let txType;
      console.log("FETCHING EFFECT?");

      // Good, but not neede for now
      // const merchantURL = paymentURL.replace("/i/", "/m/");

      // const test = await fetch(merchantURL);
      // console.log(test);
      // const test2 = await test.json();
      // // const test2 = await test.text();
      // console.log(test);
      // console.log(test2);

      try {
        console.log("path a");
        paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();
        txType = "BCH";
      } catch (err) {
        console.log("path b");
        console.log(err);
        headers = {
          ...headers,
          Accept: "application/simpleledger-paymentrequest"
        };
        paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();
        txType = "SLP";
      }

      let details: ?PaymentRequest = null;

      console.log("....?  a");
      try {
        details = await decodePaymentRequest(paymentResponse);
      } catch (e) {
        console.log("decode failed");
        console.warn(e);
        setStep("invalid");
        return;
      }
      setPaymentDetails(details);
      setStep("review");

      console.log("after");
      console.log(details);
    };

    fetchDetails();
  }, [paymentURL]);

  useEffect(() => {
    // Timer tick
    const tickInterval = setInterval(() => setTickTime(Date.now()), 1000);
    return () => clearInterval(tickInterval);
  }, []);

  // Compute render values

  const displaySymbol = tokenId
    ? tokensById[tokenId]
      ? tokensById[tokenId].symbol
      : "---"
    : "BCH";
  const decimals = tokenId ? tokensById[tokenId].decimals : 8;

  // const paymentAmountCrypto = new BigNumber(paymentAmountCrypto || 0);

  const coinImageSource = getTokenImage(tokenId);

  const sendPayment = async () => {
    console.log("SEND PAYMENT CALLED");
  };

  // remove unused?
  const stepDisplay =
    {
      fetching: "Getting Details",
      review: "Confirm Payment",
      creating: "Creating Payment",
      sending: "Sending...",
      error: "Oop, something went wrong."
    }[step] || "";

  console.log("details");
  console.log(paymentDetails);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {step === "fetching" && (
          <FullView>
            <View>
              <T center type="muted" size="large">
                Loading Transaction Details...
              </T>
              <Spacer />
              <ActivityIndicator />
            </View>
          </FullView>
        )}
        {step === "review" && (
          <>
            <Spacer small />
            <T>Review view</T>
          </>
        )}
        {step === "invalid" && (
          <FullView>
            <View>
              <T type="accent" center>
                Payment request invalid, please check with the merchant and try
                again.
              </T>
            </View>
          </FullView>
        )}
        {/* <Spacer small />
        <H2 center>{stepDisplay}</H2>
        {tokenId && (
          <T size="tiny" center>
            {tokenId}
          </T>
        )}
        <Spacer small />
        <IconArea>
          <IconImage source={coinImageSource} />
        </IconArea>
        <T>expires requestor Description amount - crypto amount - fiat</T>
        <Spacer />
        <H2 center>Sending</H2>
        <Spacer small />
        <H2 center weight="bold">
          {paymentAmountCrypto ? paymentAmountCrypto.toFormat() : "--"}{" "}
          {displaySymbol}
        </H2>
        {paymentAmountFiat && (
          <T center type="muted">
            {paymentAmountFiat}
          </T>
        )}
        <Spacer large /> */}
        {/* <H2 center>To Address</H2>
        <Spacer small />
        <T size="small" center>
          {protocol}:
        </T>
        <T center>
          <T style={{ fontWeight: "bold" }}>{addressStart}</T>
          <T size="small">{addressMiddle}</T>
          <T style={{ fontWeight: "bold" }}>{addressEnd}</T>
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
        <Spacer small />*/}
        {/* <ButtonsContainer>
          <SwipeButtonContainer>
            {step === "signing" ? (
              <ActivityIndicator size="large" />
            ) : (
              <Swipeable
                leftActionActivationDistance={
                  Dimensions.get("window").width *
                  (SWIPEABLE_WIDTH_PERCENT / 100) *
                  0.7
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
                onLeftActionComplete={() => sendPayment()}
              >
                <SwipeMainContent triggered={step === "signing"}>
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
          {step !== "signing" && (
            <Button
              nature="cautionGhost"
              text="Cancel Transaction"
              style={{ width: `${SWIPEABLE_WIDTH_PERCENT}%` }}
              onPress={() => navigation.goBack()}
            />
          )}
        </ButtonsContainer> */}
        <Spacer small />
      </ScrollView>
    </ScreenWrapper>
  );

  // ---- BELOW IS OLD.P

  // const [confirmSwipeActivated, setConfirmSwipeActivated] = useState(false);
  // const [sendError, setSendError] = useState(null);

  // const [
  //   transactionState: "setup" | "signing" | "broadcasting" | "sent",
  //   setTransactionState
  // ] = useState("setup");

  // const displaySymbol = tokenId
  //   ? tokensById[tokenId]
  //     ? tokensById[tokenId].symbol
  //     : "---"
  //   : "BCH";

  // const decimals = tokenId ? tokensById[tokenId].decimals : 8;

  // const sendAmountFormatted = new BigNumber(sendAmount);

  /// ---- CONVERTED UNTIL HERE

  // Convert BCH amount to satoshis
  // Send the entered token amount as is
  // const sendAmountAdjusted = tokenId
  //   ? sendAmountFormatted
  //   : sendAmountFormatted
  //       .shiftedBy(decimals)
  //       .integerValue(BigNumber.ROUND_FLOOR);

  // const sendAmountParam = sendAmountAdjusted.toString();

  // const signSendTransaction = async () => {
  //   setTransactionState("signing");

  //   const utxoWithKeypair = utxos.map(utxo => ({
  //     ...utxo,
  //     keypair:
  //       utxo.address === activeAccount.address ? keypair.bch : keypair.slp
  //   }));

  //   const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);

  //   let txParams = {};
  //   try {
  //     if (tokenId) {
  //       const spendableTokenUtxos = utxoWithKeypair.filter(utxo => {
  //         return (
  //           utxo.slp &&
  //           utxo.slp.baton === false &&
  //           utxo.validSlpTx === true &&
  //           utxo.slp.token === tokenId
  //         );
  //       });
  //       // Sign and send SLP Token tx
  //       txParams = {
  //         to: SLP.Address.toCashAddress(toAddress),
  //         from: activeAccount.address,
  //         value: sendAmountParam,
  //         sendTokenData: { tokenId }
  //       };

  //       await signAndPublishSlpTransaction(
  //         txParams,
  //         spendableUTXOS,
  //         {
  //           decimals
  //         },
  //         spendableTokenUtxos,
  //         activeAccount.addressSlp
  //       );
  //     } else {
  //       // Sign and send BCH tx
  //       txParams = {
  //         to: toAddress,
  //         from: activeAccount.address,
  //         value: sendAmountParam
  //       };

  //       await signAndPublishBchTransaction(txParams, spendableUTXOS);
  //     }
  //     navigation.replace("SendSuccess", { txParams });
  //   } catch (e) {
  //     setConfirmSwipeActivated(false);
  //     setTransactionState("setup");
  //     const errorFormatted =
  //       {
  //         "66: insufficient priority": new Error(
  //           "SLP transactions require a small amount of BCH to pay the transaction fee.  Please add a small amount of BCH to your wallet and try again"
  //         )
  //       }[e.error] || e;

  //     setSendError(errorFormatted);
  //   }
  // };
  // // Return to setup if any tx params are missing
  // if ((!tokenId && displaySymbol !== "BCH") || !sendAmount || !toAddress) {
  //   navigation.navigate("SendSetup", { tokenId });
  // }

  // const imageSource = getTokenImage(tokenId);

  // const coinName = !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  // // toAddress like
  // // -> simpleledger:qq2addressHash
  // // -> l344f3legacyFormatted
  // const addressParts = toAddress.split(":");
  // const address = addressParts.length === 2 ? addressParts[1] : addressParts[0];
  // const protocol = addressParts.length === 2 ? addressParts[0] : "legacy";

  // const addressStart = address.slice(0, 5);
  // const addressMiddle = address.slice(5, -6);
  // const addressEnd = address.slice(-6);

  // const isBCH = !tokenId;
  // const BCHFiatAmount = isBCH
  //   ? spotPrices["bch"][fiatCurrency].rate * (sendAmountParam / 10 ** 8)
  //   : 0;
  // const fiatDisplay = isBCH
  //   ? formatFiatAmount(
  //       new BigNumber(BCHFiatAmount),
  //       fiatCurrency,
  //       tokenId || "bch"
  //     )
  //   : null;

  // return (
  //   <ScreenWrapper>
  //     <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
  //       <Spacer small />
  //       <H1 center>{coinName}</H1>
  //       {tokenId && (
  //         <T size="tiny" center>
  //           {tokenId}
  //         </T>
  //       )}
  //       <Spacer small />
  //       <IconArea>
  //         <IconImage source={imageSource} />
  //       </IconArea>

  //       <Spacer />
  //       <H2 center>Sending</H2>
  //       <Spacer small />
  //       <H2 center weight="bold">
  //         {sendAmountFormatted.toFormat() || "--"} {displaySymbol}
  //       </H2>
  //       {fiatDisplay && (
  //         <T center type="muted">
  //           {fiatDisplay}
  //         </T>
  //       )}
  //       <Spacer large />
  //       <H2 center>To Address</H2>
  //       <Spacer small />
  //       <T size="small" center>
  //         {protocol}:
  //       </T>
  //       <T center>
  //         <T style={{ fontWeight: "bold" }}>{addressStart}</T>
  //         <T size="small">{addressMiddle}</T>
  //         <T style={{ fontWeight: "bold" }}>{addressEnd}</T>
  //       </T>
  //       <Spacer small />
  //       {sendError && (
  //         <ErrorHolder>
  //           <T center type="danger">
  //             {sendError.message || sendError.error}
  //           </T>
  //         </ErrorHolder>
  //       )}
  //       <Spacer fill />
  //       <Spacer small />

  //       <ButtonsContainer>
  //         <SwipeButtonContainer>
  //           {transactionState === "signing" ? (
  //             <ActivityIndicator size="large" />
  //           ) : (
  //             <Swipeable
  //               leftActionActivationDistance={
  //                 Dimensions.get("window").width *
  //                 (SWIPEABLE_WIDTH_PERCENT / 100) *
  //                 0.7
  //               }
  //               leftContent={
  //                 <SwipeContent activated={confirmSwipeActivated}>
  //                   {confirmSwipeActivated ? (
  //                     <T weight="bold" type="inverse">
  //                       Release to send
  //                     </T>
  //                   ) : (
  //                     <T weight="bold" type="inverse">
  //                       Keep pulling
  //                     </T>
  //                   )}
  //                 </SwipeContent>
  //               }
  //               onLeftActionActivate={() => setConfirmSwipeActivated(true)}
  //               onLeftActionDeactivate={() => setConfirmSwipeActivated(false)}
  //               onLeftActionComplete={() => signSendTransaction()}
  //             >
  //               <SwipeMainContent triggered={transactionState === "signing"}>
  //                 <T weight="bold" type="inverse">
  //                   Swipe{" "}
  //                 </T>
  //                 <T weight="bold" type="inverse" style={{ paddingTop: 2 }}>
  //                   <Ionicons name="ios-arrow-round-forward" size={25} />
  //                 </T>
  //                 <T weight="bold" type="inverse">
  //                   {" "}
  //                   To Send
  //                 </T>
  //               </SwipeMainContent>
  //             </Swipeable>
  //           )}
  //         </SwipeButtonContainer>
  //         <Spacer />
  //         {transactionState !== "signing" && (
  //           <Button
  //             nature="cautionGhost"
  //             text="Cancel Transaction"
  //             style={{ width: `${SWIPEABLE_WIDTH_PERCENT}%` }}
  //             onPress={() => navigation.goBack()}
  //           />
  //         )}
  //       </ButtonsContainer>
  //       <Spacer small />
  //     </ScrollView>
  //   </ScreenWrapper>
  // );
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

export default connect(mapStateToProps)(Bip70ConfirmScreen);
