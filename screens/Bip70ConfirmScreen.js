// @flow

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  View,
  Image
} from "react-native";
import BigNumber from "bignumber.js";

import { Button, T, H1, H2, Spacer, SwipeButton } from "../atoms";

import { type TokenData } from "../`data/tokens/reducer";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { type UTXO } from "../data/utxos/reducer";
import { type ECPair } from "../data/accounts/reducer";

import {
  getKeypairSelector,
  activeAccountSelector
} from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";

import {
  formatAmount,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";
import { type CurrencyCode } from "../utils/currency-utils";
import { getTokenImage } from "../utils/token-utils";

import {
  decodePaymentRequest,
  decodePaymentResponse,
  getAsArrayBuffer,
  signAndPublishPaymentRequestTransaction,
  signAndPublishPaymentRequestTransactionSLP,
  txidFromHex,
  type PaymentRequest
} from "../utils/bip70-utils";

const ScreenWrapper = styled(SafeAreaView)`
  height: 100%;
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

// const ErrorHolder = styled(View)`
//   margin: 0 16px;
//   padding: 8px;
//   background-color: ${props => props.theme.danger700};
//   border-width: ${StyleSheet.hairlineWidth};
//   border-radius: 3px;
//   border-color: ${props => props.theme.danger300};
// `;

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
  const [sendError, setSendError] = useState(null);
  const [tickTime: number, setTickTime] = useState(Date.now());
  const [coinType, setCoinType] = useState(null);

  const [paymentDetails: ?PaymentRequest, setPaymentDetails] = useState(null);

  const [
    step: "fetching" | "review" | "sending" | "confirmed" | "error" | "invalid",
    setStep
  ] = useState("fetching");

  const coinImageSource = useMemo(
    () => getTokenImage(paymentDetails ? paymentDetails.tokenId : null),
    [paymentDetails]
  );

  const coinName = useMemo(() => {
    if (!paymentDetails) return null;
    const tokenId = paymentDetails.tokenId;
    return tokenId ? tokensById[tokenId].name : "Bitcoin Cash";
  }, [paymentDetails, tokensById]);

  const coinSymbol = useMemo(() => {
    if (!paymentDetails) return null;
    const tokenId = paymentDetails.tokenId;
    return tokenId ? tokensById[tokenId].symbol : "BCH";
  }, [paymentDetails, tokensById]);

  const coinDecimals = useMemo(() => {
    if (!paymentDetails) return 8;
    return tokensById[paymentDetails.tokenId]
      ? tokensById[paymentDetails.tokenId].decimals
      : 8;
  }, [paymentDetails, tokensById]);

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
      let details: PaymentRequest;

      let trySLP = false;

      try {
        paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();
        console.log("????1");
        details = await decodePaymentRequest(paymentResponse);
        console.log("????2  ");

        // NOT GETTING HERE - NEED TO GET DECODE TO WORK WITH NON-OP-RETURN THINGS?
        // FIGURE IT OUT.

        setCoinType("BCH");
      } catch (err) {
        trySLP = true;
      }

      if (trySLP) {
        try {
          headers = {
            ...headers,
            Accept: "application/simpleledger-paymentrequest"
          };
          paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();s
          details = await decodePaymentRequest(paymentResponse);

          setCoinType("SLP");
        } catch (e) {
          console.warn("decoding payment request failed");
          console.warn(e);
          setStep("invalid");
          return;
        }
      }

      // Console.log(SLP info and amounts should be set on here at this time.)
      console.log("seting details");
      console.log(details);

      setPaymentDetails(details);
      setStep("review");
    };

    fetchDetails();
  }, [paymentURL]);

  // Timer update
  useEffect(() => {
    const tickInterval = setInterval(() => setTickTime(Date.now()), 1000);
    return () => clearInterval(tickInterval);
  }, []);

  const sendPayment = useCallback(async () => {
    if (!paymentDetails) return null;

    setStep("sending");
    const utxoWithKeypair = utxos.map(utxo => ({
      ...utxo,
      keypair:
        utxo.address === activeAccount.address ? keypair.bch : keypair.slp
    }));

    let paymentResponse = null;

    if (paymentDetails.tokenId) {
      const { tokenId } = paymentDetails;
      const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);
      const spendableTokenUtxos = utxoWithKeypair.filter(utxo => {
        return (
          utxo.slp &&
          utxo.slp.baton === false &&
          utxo.validSlpTx === true &&
          utxo.slp.token === tokenId
        );
      });
      paymentResponse = await signAndPublishPaymentRequestTransactionSLP(
        paymentDetails,
        activeAccount.addressSlp,
        activeAccount.address,
        { decimals: coinDecimals },
        spendableUTXOS,
        spendableTokenUtxos
      );
    } else {
      const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);
      const refundKeypair = paymentDetails.tokenId ? keypair.slp : keypair.bch;

      paymentResponse = await signAndPublishPaymentRequestTransaction(
        paymentDetails,
        activeAccount.address,
        refundKeypair,
        spendableUTXOS
      );
    }
    try {
      const { responsePayment, responseAck } = await decodePaymentResponse(
        paymentResponse
      );
      const txHex = responsePayment.message.transactions[0].toHex();
      const txid = txidFromHex(txHex);

      setStep("success");
      navigation.replace("Bip70Success", { txid });
    } catch (e) {
      setSendError(e.message);
      setStep("error");
      return;
    }
  }, [
    paymentDetails,
    utxos,
    activeAccount,
    coinDecimals,
    keypair.bch,
    keypair.slp,
    navigation
  ]);

  const remainingTime = paymentDetails
    ? paymentDetails.expires - tickTime / 1000
    : 0;
  const minutes = (Math.floor(remainingTime / 60) % 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(remainingTime % 60)
    .toString()
    .padStart(2, "0");

  useEffect(() => {
    if (remainingTime < 0) {
      setStep("invalid");
    }
  }, [remainingTime]);

  // Don't use for now, as this is non-standard / not part of BIP70 officially
  // const merchantData = useMemo(
  //   () => (paymentDetails ? JSON.parse(paymentDetails.merchantData) : null),
  //   [paymentDetails]
  // );

  const fiatAmountTotal = useMemo(() => {
    if (paymentDetails) {
      if (paymentDetails.tokenId) {
        return computeFiatAmount(
          new BigNumber(paymentDetails.totalValue),
          spotPrices,
          fiatCurrency,
          paymentDetails.tokenId
        );
      } else {
        return computeFiatAmount(
          new BigNumber(paymentDetails.totalValue),
          spotPrices,
          fiatCurrency,
          "bch"
        );
      }
    }
    return null;
  }, [paymentDetails, fiatCurrency, spotPrices]);

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingLeft: 16,
          paddingRight: 16
        }}
      >
        {step === "review" && paymentDetails && (
          <>
            <Spacer small />
            <T center size="large">{`${coinName} (${coinSymbol})`}</T>
            {paymentDetails.tokenId && (
              <T size="tiny" center>
                {paymentDetails.tokenId}
              </T>
            )}
            <Spacer small />
            <IconArea>
              <IconImage source={coinImageSource} />
            </IconArea>

            <Spacer />
            <T center monospace size="large">{`${minutes}:${seconds}`}</T>
            <Spacer small />
            <T center size="small" type="muted">
              Payment Amount
            </T>
            <Spacer tiny />
            <T center monospace size="large">
              {`${formatAmount(
                BigNumber(
                  paymentDetails.tokenId
                    ? paymentDetails.totalTokenAmount
                    : paymentDetails.totalValue
                ),
                coinDecimals,
                true
              )} ${coinSymbol ? coinSymbol : ""}`}
            </T>
            {!paymentDetails.tokenId && (
              <>
                <Spacer tiny />
                <T center monospace>
                  {formatFiatAmount(
                    fiatAmountTotal,
                    fiatCurrency,
                    paymentDetails.tokenId || "bch"
                  )}
                </T>
              </>
            )}
            <Spacer />
            <T center size="small">
              {paymentDetails.network === "main"
                ? "Main Network"
                : "Test Network"}
            </T>
            <T
              size="small"
              type={paymentDetails.verified ? "primary" : "danger"}
              center
            >
              {/* {paymentDetails.verified ? "Verified" : "Not verified"} */}
            </T>
            <Spacer small />
            <T center size="small" type="muted">
              Payment URL
            </T>
            <T center>{paymentDetails.paymentUrl}</T>
            <Spacer small />
            <T center size="small" type="muted">
              Memo
            </T>
            <T center>{paymentDetails.memo}</T>
            <Spacer fill />
            <Spacer small />
            <ButtonsContainer>
              <SwipeButton
                swipeFn={sendPayment}
                labelAction="To pay"
                labelRelease="Release to pay"
                labelHalfway="Keep going"
              />
              <Spacer small />
              <Button
                nature="cautionGhost"
                text="Cancel payment"
                onPress={() => navigation.goBack()}
              />
            </ButtonsContainer>
          </>
        )}
        {step === "fetching" && (
          <FullView>
            <View>
              <ActivityIndicator />
              <Spacer small />
              <T center type="muted" monospace>
                Loading Transaction Details...
              </T>
            </View>
          </FullView>
        )}
        {step === "sending" && (
          <FullView>
            <View>
              <ActivityIndicator />
              <Spacer small />
              <T center type="muted" monospace>
                Sending Payment
              </T>
            </View>
          </FullView>
        )}
        {step === "invalid" && (
          <FullView>
            <View>
              <T type="accent" center>
                This payment request is invalid, expired or already paid, please
                check with the merchant and try again.
              </T>
            </View>
          </FullView>
        )}
        {step === "error" && (
          <FullView>
            <View>
              <T type="danger" center>
                Error while sending payment.
              </T>
              <Spacer small />
              <T type="danger" center>
                {sendError}
              </T>
            </View>
          </FullView>
        )}
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

export default connect(mapStateToProps)(Bip70ConfirmScreen);
