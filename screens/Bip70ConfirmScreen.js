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
// import { SLP } from "../utils/slp-sdk-utils";
import {
  decodePaymentRequest,
  decodePaymentResponse,
  getAsArrayBuffer,
  signAndPublishPaymentRequestTransaction,
  txidFromHex,
  type PaymentRequest
  // type MerchantData
} from "../utils/bip70-utils";

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

  const [paymentDetails: ?PaymentRequest, setPaymentDetails] = useState(null);

  const [tokenId, setTokenId] = useState(null);
  const [paymentAmountCrypto: ?BigNumber, setPaymentAmountCrypto] = useState(
    null
  ); // maybe not needed, can get from payment details?
  const [paymentAmountFiat: ?number, setPaymentAmountFiat] = useState(null);

  const [
    step: "fetching" | "review" | "sending" | "confirmed" | "error" | "invalid",
    setStep
  ] = useState("fetching");

  const coinImageSource = useMemo(() => getTokenImage(tokenId), [tokenId]);

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
      // let paymentRequest;
      // let txType;

      try {
        paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();
        // txType = "BCH";
      } catch (err) {
        headers = {
          ...headers,
          Accept: "application/simpleledger-paymentrequest"
        };
        paymentResponse = await getAsArrayBuffer(paymentURL, headers); //paymentRequest.blob();
        // txType = "SLP";
      }

      let details: ?PaymentRequest = null;

      try {
        details = await decodePaymentRequest(paymentResponse);
      } catch (e) {
        console.warn("decoding payment request failed");
        console.warn(e);
        setStep("invalid");
        return;
      }
      setPaymentDetails(details);
      setStep("review");
    };

    fetchDetails();
  }, [paymentURL]);

  useEffect(() => {
    // Timer tick
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

    const spendableUTXOS = utxoWithKeypair.filter(utxo => utxo.spendable);

    try {
      const refundKeypair = tokenId ? keypair.slp : keypair.bch;
      const paymentResponse = await signAndPublishPaymentRequestTransaction(
        paymentDetails,
        activeAccount.address,
        refundKeypair,
        spendableUTXOS
      );

      const { responsePayment, responseAck } = await decodePaymentResponse(
        paymentResponse
      );

      const txHex = responsePayment.message.transactions[0].toHex();
      const txid = txidFromHex(txHex);

      // return tx;
    } catch (e) {
      setStep("error");
      return;
    }

    setStep("success");
    navigation.replace("Bip70Success");
  }, [
    paymentDetails,
    utxos,
    activeAccount.address,
    keypair.bch,
    keypair.slp,
    tokenId,
    navigation
  ]);

  // Compute render values
  // const displaySymbol = tokenId
  //   ? tokensById[tokenId]
  //     ? tokensById[tokenId].symbol
  //     : "---"
  //   : "BCH";
  const decimals = tokenId ? tokensById[tokenId].decimals : 8;

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

  const merchantData = useMemo(
    () => (paymentDetails ? JSON.parse(paymentDetails.merchantData) : null),
    [paymentDetails]
  );

  const fiatAmountTotal = useMemo(() => {
    if (paymentDetails) {
      if (tokenId) {
        return computeFiatAmount(
          new BigNumber(paymentDetails.totalValue),
          spotPrices,
          fiatCurrency,
          tokenId
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
  }, [paymentDetails, tokenId, fiatCurrency, spotPrices]);

  const coinName = useMemo(() => {
    if (!merchantData) return "----";
    if (merchantData.fiat_symbol === "BCH") return "Bitcoin Cash";
    return "SLP Token";
  }, [merchantData]);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {step === "review" && paymentDetails && (
          <>
            <Spacer small />
            <T center>{`${coinName} (${merchantData.fiat_symbol})`}</T>
            {tokenId && (
              <T size="tiny" center>
                {tokenId}
              </T>
            )}
            <Spacer tiny />
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
                BigNumber(paymentDetails.totalValue),
                decimals,
                true
              )} ${merchantData.fiat_symbol}`}
            </T>
            <Spacer tiny />
            <T center monospace>
              {formatFiatAmount(
                fiatAmountTotal,
                fiatCurrency,
                tokenId || "bch"
              )}
            </T>
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
                Error while sending payment, please verify with the merchant and
                try again.
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
