import React, { useState, useMemo, useEffect, useCallback } from "react";
import { connect, ConnectedProps } from "react-redux";
import { NavigationScreenProps } from "react-navigation";
import styled from "styled-components";
import {
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  View,
  Image,
  TextInput,
  StyleSheet
} from "react-native";
import { Overlay, Text } from "react-native-elements";
import BigNumber from "bignumber.js";

import { Button, T, Spacer, SwipeButton } from "../atoms";

import { tokensByIdSelector } from "../data/tokens/selectors";

import { updateTokensMeta } from "../data/tokens/actions";
import { updateUtxos } from "../data/utxos/actions";

import {
  getKeypairSelector,
  activeAccountSelector,
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";
import {
  utxosByAccountSelector,
  isUpdatingUTXO
} from "../data/utxos/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";

import {
  formatAmount,
  formatAmountInput,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";
import { getTokenImage } from "../utils/token-utils";

import {
  decodePaymentRequest,
  decodePaymentResponse,
  getAsArrayBuffer,
  signAndPublishPaymentRequestTransaction,
  signAndPublishPaymentRequestTransactionSLP,
  txidFromHex,
  appendOptionalOutput,
  PaymentRequest
} from "../utils/bip70-utils";

import { FullState } from "../data/store";

import lang from "../_locales/index";
let tran = new lang("Bip70ConfirmScreen");

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

const StyledTextInputAmount = styled(TextInput)`
  border-color: ${props => props.theme.accent500};
  border-right-width: ${StyleSheet.hairlineWidth};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
  border-bottom-right-radius: 3px;
  border-top-right-radius: 3px;
  padding: 16px 8px;
  flex: 1;
  color: ${props => props.theme.fg100};
`;

const AmountLabel = styled(View)`
  padding: 0 8px;
  align-items: center;
  justify-content: center;
  border-left-width: ${StyleSheet.hairlineWidth};
  border-top-width: ${StyleSheet.hairlineWidth};
  border-bottom-width: ${StyleSheet.hairlineWidth};
  border-bottom-left-radius: 3px;
  border-top-left-radius: 3px;
  border-color: ${props => props.theme.accent500};
`;

const AmountInputRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const ButtonsContainer = styled(View)`
  align-items: center;
`;

const FullView = styled(View)`
  flex: 1;
  justify-content: center;
  padding: 0 16px;
`;

const mapStateToProps = (state: FullState) => {
  const tokensById = tokensByIdSelector(state);
  const activeAccount = activeAccountSelector(state);
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  const utxos = utxosByAccountSelector(
    state,
    activeAccount && activeAccount.address
  );

  const keypair = getKeypairSelector(state);
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);
  const utxoUpdating = isUpdatingUTXO(state);
  return {
    activeAccount,
    address,
    addressSlp,
    keypair,
    spotPrices,
    fiatCurrency,
    tokensById,

    utxoUpdating,
    utxos
  };
};

const mapDispatchToProps = {
  updateTokensMeta,
  updateUtxos
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type PropsFromParent = NavigationScreenProps & {
  route: {
    params: {
      paymentURL: string;
    };
  };
};

type Props = PropsFromRedux & PropsFromParent;

const Bip70ConfirmScreen = ({
  navigation,
  route,
  tokensById,
  address,
  addressSlp,
  activeAccount,
  utxos,
  fiatCurrency,
  keypair,
  spotPrices,
  utxoUpdating,
  updateUtxos,
  updateTokensMeta
}: Props) => {
  // Props / state variables
  const { paymentURL } = route.params;

  if (!paymentURL) {
    console.warn("No BIP70 payment URL found, returning to previous screen");
    navigation.goBack();
  }

  // Setup state hooks
  const [sendError, setSendError] = useState(null);
  const [tickTime, setTickTime] = useState(Date.now());

  const [paymentDetails, setPaymentDetails] = useState<PaymentRequest | null>(
    null
  );

  const [overlayVisible, setOverlayVisible] = useState<Boolean | null>(null);
  const [addOutputAmount, setAddOutputAmount] = useState("");

  const [step, setStep] = useState("fetching");

  const coinImageSource = useMemo(
    () => getTokenImage(paymentDetails && paymentDetails.tokenId),
    [paymentDetails]
  );

  const coinInfo = useMemo(() => {
    if (!paymentDetails) {
      return {
        name: null,
        symbol: null,
        decimals: null
      };
    }

    const tokenId = paymentDetails.tokenId;
    const tokenInfo = tokenId && tokensById[tokenId];

    if (!tokenId) {
      return {
        name: "Bitcoin Cash",
        symbol: "BCH",
        decimals: 8
      };
    }

    if (tokenInfo) {
      return {
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals
      };
    }

    return {
      name: null,
      symbol: null,
      decimals: null
    };
  }, [paymentDetails, tokensById]);

  useEffect(() => {
    // update UTXOs on load
    updateUtxos(address, addressSlp);
  }, [address, addressSlp, updateUtxos]);

  useEffect(() => {
    // Fetch token Metadata if it is unknown
    if (!paymentDetails || !paymentDetails.tokenId) return;
    if (!tokensById[paymentDetails.tokenId]) {
      updateTokensMeta([paymentDetails.tokenId]);
    }
  }, [paymentDetails, tokensById, updateTokensMeta]);

  useEffect(() => {
    // Fetch payment details on initial load
    setStep("fetching");

    // Assume BCH, but fail over to SLP
    const fetchDetails = async () => {
      let headers = {
        Accept: "application/bitcoincash-paymentrequest",
        "Content-Type": "application/octet-stream"
      };
      let paymentResponse;
      let details: PaymentRequest | null = null;
      let trySLP = false;

      try {
        paymentResponse = await getAsArrayBuffer(paymentURL, headers);
        details = await decodePaymentRequest(paymentResponse);
      } catch (err) {
        trySLP = true;
      }

      if (trySLP) {
        try {
          headers = {
            ...headers,
            Accept: "application/simpleledger-paymentrequest"
          };
          paymentResponse = await getAsArrayBuffer(paymentURL, headers);
          details = await decodePaymentRequest(paymentResponse);
        } catch (e) {
          console.warn("decoding payment request failed");
          console.warn(e);

          setStep("invalid");
          return;
        }
      }
      // console.log("details", details);
      setPaymentDetails(details);
      setStep("review");
    };
    fetchDetails();
  }, [paymentURL]);

  useEffect(() => {
    // Timer update
    const tickInterval = setInterval(() => setTickTime(Date.now()), 1000);
    return () => clearInterval(tickInterval);
  }, []);

  const sendPayment = useCallback(async () => {
    if (!paymentDetails || !activeAccount || !keypair) {
      return null;
    }
    setStep("sending");
    let paymentResponse = null;

    const keypairs = [keypair.bch, keypair.slp];

    try {
      if (paymentDetails.tokenId) {
        const { tokenId } = paymentDetails;
        const spendableUTXOS = utxos.filter(utxo => !utxo.slp);
        const spendableTokenUtxos = utxos.filter(utxo => {
          return (
            utxo.slp &&
            utxo.slp.type !== "BATON" &&
            utxo.slp.tokenId === tokenId
          );
        });
        paymentResponse = await signAndPublishPaymentRequestTransactionSLP(
          paymentDetails,
          activeAccount.addressSlp,
          activeAccount.address,
          {
            decimals: coinInfo.decimals
          },
          spendableUTXOS,
          spendableTokenUtxos,
          keypairs
        );
      } else {
        const spendableUTXOS = utxos.filter(utxo => !utxo.slp);
        const refundKeypair = paymentDetails.tokenId
          ? keypair.slp
          : keypair.bch;

        paymentResponse = await signAndPublishPaymentRequestTransaction(
          paymentDetails,
          activeAccount.address,
          refundKeypair,
          spendableUTXOS,
          keypairs
        );
      }
    } catch (e) {
      console.warn(e);
      setSendError(e.message);
      setStep("error");
      return;
    }

    try {
      const { responsePayment, responseAck } = await decodePaymentResponse(
        paymentResponse
      );
      const txHex = responsePayment.message.transactions[0].toHex();
      const txid = txidFromHex(txHex);

      setStep("success");
      navigation.replace("Bip70Success", {
        txid
      });
    } catch (e) {
      console.warn(e);
      setSendError(e.message);
      setStep("error");
      return;
    }
  }, [paymentDetails, utxos, activeAccount, coinInfo, keypair, navigation]);

  const remainingTime = paymentDetails
    ? paymentDetails.expires - tickTime / 1000
    : 0;

  useEffect(() => {
    if (remainingTime < 0) {
      setStep("invalid");
    }
  }, [remainingTime]);

  const minutes = (Math.floor(remainingTime / 60) % 60)
    .toString()
    .padStart(2, "0");

  const seconds = Math.floor(remainingTime % 60)
    .toString()
    .padStart(2, "0");

  // Not used for now.
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

  const addOutput = amount => {
    const output = {
      script: paymentDetails.merchantData.optional_output.script,
      amount: amount
    };
    const updatedpaymentDetails = appendOptionalOutput(
      output,
      paymentDetails,
      coinInfo
    );
    // console.log('updatedPaymentDetails', updatedpaymentDetails)
    setPaymentDetails(updatedpaymentDetails);
    setOverlayVisible(false);
  };

  const requestAmount =
    paymentDetails && paymentDetails.tokenId
      ? paymentDetails.totalTokenAmount
      : paymentDetails?.totalValue;

  const formattedAmount = `${formatAmount(
    new BigNumber(requestAmount || 0),
    coinInfo.decimals,
    true
  )} ${coinInfo ? coinInfo.symbol : ""}`;

  // console.log('paymentDetails', paymentDetails)
  let optionalOutputText = "";
  if (paymentDetails && paymentDetails.merchantData.optional_output) {
    optionalOutputText = paymentDetails.merchantData.optional_output.msg;
    if (overlayVisible == null) {
      setOverlayVisible(true);
    }
  }

  return (
    <ScreenWrapper>
      <Overlay
        isVisible={!overlayVisible ? false : true}
        onBackdropPress={() => setOverlayVisible(false)}
        width="auto"
        height="auto"
      >
        <View>
          <T>{optionalOutputText}</T>
          <Spacer small />
          <AmountInputRow>
            <AmountLabel>
              <T type="muted2" weight="bold">
                {coinInfo.symbol}
              </T>
            </AmountLabel>
            <StyledTextInputAmount
              keyboardType="numeric"
              editable
              placeholder="0.0"
              autoCompleteType="off"
              autoCorrect={false}
              autoCapitalize="none"
              value={addOutputAmount}
              onChangeText={text => {
                // setErrors([]);
                setAddOutputAmount(formatAmountInput(text, coinInfo.decimals));
              }}
            />
          </AmountInputRow>
          <Spacer small />
          <Button
            onPress={() => addOutput(addOutputAmount)}
            text={
              parseFloat(addOutputAmount) > 0
                ? tran.getStr("Btn_Add_Amount")
                : tran.getStr("Btn_Cancel")
            }
          />
        </View>
      </Overlay>
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
            <T center size="large">{`${coinInfo.name} (${coinInfo.symbol})`}</T>
            {paymentDetails.tokenId && (
              <T size="tiny" center>
                {paymentDetails.tokenId}
              </T>
            )}
            <Spacer small />
            <IconArea>
              <IconImage source={coinImageSource} />
            </IconArea>
            <Spacer small />
            <T center monospace size="large">{`${minutes}:${seconds}`}</T>
            <Spacer />
            <T center size="small" type="muted">
              {tran.getStr("Payment_Amount")}
            </T>
            <Spacer tiny />
            <T center monospace size="large" weight="bold">
              {formattedAmount}
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

            <Spacer small />
            <T center size="small" type="muted">
              {tran.getStr("Payment_URL")}
            </T>
            <T center>{paymentDetails.paymentUrl}</T>
            <Spacer small />
            <T center size="small" type="muted">
              {tran.getStr("Msg_Memo")}
            </T>
            <T center>{paymentDetails.memo}</T>
            <Spacer fill />
            <Spacer small />
            <ButtonsContainer>
              <SwipeButton
                swipeFn={() => sendPayment()}
                labelAction={tran.getStr("labelAction_ToSend")}
              />
              <Spacer small />
              <Button
                nature="cautionGhost"
                text={tran.getStr("Cancel_payment")}
                onPress={() => navigation.goBack()}
              />
            </ButtonsContainer>
          </>
        )}
        {step === "fetching" && (
          <FullView>
            <View>
              <ActivityIndicator size="large" color="green" />
              <Spacer small />
              <T center type="muted" monospace>
                {tran.getStr("Loading_Transaction_Details")}
              </T>
            </View>
          </FullView>
        )}
        {step === "sending" && (
          <FullView>
            <View>
              <ActivityIndicator size="large" color="green" />
              <Spacer small />
              <T center type="muted" monospace>
                {tran.getStr("Sending_Payment")}
              </T>
            </View>
          </FullView>
        )}
        {step === "invalid" && (
          <FullView>
            <View>
              <T type="accent" center>
                {tran.getStr("This_payment_request")}
              </T>
            </View>
          </FullView>
        )}
        {step === "error" && (
          <FullView>
            <View>
              <T type="danger" center>
                {tran.getStr("Error_while_sending_payment")}
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

export default connector(Bip70ConfirmScreen);
