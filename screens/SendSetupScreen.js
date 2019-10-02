// @flow
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  Clipboard,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  View
} from "react-native";
import { Header } from "react-navigation";
import BigNumber from "bignumber.js";

import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T, H1, H2, Button, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";

import { updateTokensMeta } from "../data/tokens/actions";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";
import { activeAccountSelector } from "../data/accounts/selectors";
import { utxosByAccountSelector } from "../data/utxos/selectors";

import {
  formatAmount,
  formatAmountInput,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";
import { getTokenImage } from "../utils/token-utils";
import { currencyDecimalMap, type CurrencyCode } from "../utils/currency-utils";
import { decodePaymentRequest, getAsArrayBuffer } from "../utils/bip70-utils";

import { SLP } from "../utils/slp-sdk-utils";

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  balances: Balances,
  spotPrices: any,
  fiatCurrency: CurrencyCode,
  updateTokensMeta: Function,
  navigation: {
    navigate: Function,
    state?: {
      params: {
        tokenId: ?string,
        uriAmount?: ?string,
        uriAddress?: ?string,
        uriError?: ?string
      }
    }
  }
};

type AddressData = {
  tokenId: ?string,
  parseError: ?string,
  amount: ?number,
  address: ?string
};

const StyledTextInput = styled(TextInput)`
  border-color: ${props => props.theme.accent500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 3px;
  padding: 16px 8px;
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

const ScreenWrapper = styled(View)`
  position: relative;
  flex: 1;
`;

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const StyledButton = styled(Button)`
  align-items: center;
  flex-direction: row;
`;

const ButtonArea = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const ActionButtonArea = styled(View)`
  align-items: center;
`;

const AmountButtonArea = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const AmountRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`;

const AmountInputRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const QROverlayScreen = styled(View)`
  position: absolute;
  padding: 0 16px;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: ${Dimensions.get("window").width}px;
  height: ${Dimensions.get("window").height}px;
  z-index: 1;
  background-color: ${props => props.theme.bg900};
`;

const IconArea = styled(View)`
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;
const IconImage = styled(Image)`
  width: 32;
  height: 32;
  border-radius: 16;
  overflow: hidden;
`;

const ErrorContainer = styled(View)`
  border-color: ${props => props.theme.danger500};
  border-width: 1px;
  border-radius: 3px;
  padding: 8px;
  background-color: ${props => props.theme.danger700};
`;

const SendSetupScreen = ({
  navigation,
  tokensById,
  balances,
  utxos,
  spotPrices,
  fiatCurrency,
  updateTokensMeta
}: Props) => {
  const [qrOpen, setQrOpen] = useState(false);

  const [toAddress, setToAddress] = useState("");

  const [sendAmount, setSendAmount] = useState("");
  const [sendAmountFiat, setSendAmountFiat] = useState("0");
  const [sendAmountCrypto, setSendAmountCrypto] = useState("0");
  const [amountType, setAmountType] = useState("crypto");

  const [errors, setErrors] = useState([]);

  const { tokenId, uriAddress, uriAmount, uriError } = (navigation.state &&
    navigation.state.params) || {
    tokenId: null,
    uriAddress: null,
    uriAmount: null,
    uriError: null
  };

  const displaySymbol = tokenId
    ? tokensById[tokenId]
      ? tokensById[tokenId].symbol
      : "---"
    : "BCH";

  // Set initial values from params
  useEffect(() => {
    if (uriAddress) {
      setToAddress(uriAddress);
    }
    if (uriAmount) {
      setAmountType("crypto");
      setSendAmount(uriAmount);
    }
    if (uriError) {
      setErrors([uriError]);
    }
  }, []);

  // Fetch token Metadata if it is unknown
  useEffect(() => {
    if (!tokenId) return;
    if (!tokensById[tokenId]) {
      updateTokensMeta([tokenId]);
    }
  }, [tokenId, tokensById, updateTokensMeta]);

  let availableAmount = new BigNumber(0);
  if (tokenId) {
    availableAmount = balances.slpTokens[tokenId];
  } else {
    const spendableUTXOS = utxos.filter(utxo => utxo.spendable);
    const allUTXOFee = SLP.BitcoinCash.getByteCount(
      { P2PKH: spendableUTXOS.length },
      { P2PKH: 2 }
    );

    // Available = total satoshis - fee for including all UTXO
    const availableRaw = balances.satoshisAvailable.minus(allUTXOFee);

    if (availableRaw.lte(0)) {
      availableAmount = new BigNumber(0);
    } else {
      availableAmount = availableRaw;
    }
  }

  if (!availableAmount) {
    availableAmount = new BigNumber(0);
  }

  const coinDecimals =
    tokenId && tokensById[tokenId] ? tokensById[tokenId].decimals : 8;

  const availableFunds = availableAmount.shiftedBy(-1 * coinDecimals);
  const availableFundsDisplay = formatAmount(availableAmount, coinDecimals);

  let fiatAmountTotal = null;
  if (tokenId) {
    fiatAmountTotal = computeFiatAmount(
      availableAmount,
      spotPrices,
      fiatCurrency,
      tokenId
    );
  } else {
    fiatAmountTotal = computeFiatAmount(
      availableAmount,
      spotPrices,
      fiatCurrency,
      "bch"
    );
  }
  const fiatDisplayTotal = !tokenId
    ? formatFiatAmount(fiatAmountTotal, fiatCurrency, tokenId || "bch")
    : null;

  const fiatRate = !tokenId
    ? spotPrices["bch"][fiatCurrency] && spotPrices["bch"][fiatCurrency].rate
    : null;

  const sendAmountNumber = parseFloat(sendAmount);

  const tokenName =
    tokenId && tokensById[tokenId] ? tokensById[tokenId].name : "---";
  const coinName = !tokenId ? "Bitcoin Cash" : tokenName;

  const imageSource = getTokenImage(tokenId);

  const toggleAmountType = () => {
    if (tokenId) return;
    setAmountType(amountType === "crypto" ? "fiat" : "crypto");
  };

  const goNextStep = () => {
    let addressFormat = null;
    try {
      addressFormat = SLP.Address.detectAddressFormat(toAddress);
    } catch (e) {
      setErrors(["Invalid address, double check and try again."]);
      return;
    }

    let hasErrors = false;
    if (tokenId && !["slpaddr", "cashaddr", "legacy"].includes(addressFormat)) {
      setErrors([
        "Can only send SLP tokens to SimpleLedger addresses.  The to address should begin with `simpleledger:`"
      ]);
      hasErrors = true;
    } else if (!tokenId && !["cashaddr", "legacy"].includes(addressFormat)) {
      setErrors([
        "Can only send Bitcoin Cash (BCH) to cash addresses, the to address should begin with `bitcoincash:`"
      ]);
      hasErrors = true;
    }

    if (parseFloat(sendAmountCrypto) > availableFunds) {
      setErrors(["Cannot send more funds than are available"]);
      hasErrors = true;
    }

    if (!sendAmount) {
      setErrors(["Amount required"]);
      hasErrors = true;
    }

    if (!sendAmountCrypto) {
      setErrors(["Amount required"]);
      hasErrors = true;
    }

    if (!hasErrors) {
      navigation.navigate("SendConfirm", {
        tokenId,
        sendAmount: sendAmountCrypto,
        toAddress
      });
    }
  };

  const parseQr = (
    qrData: string
  ): {
    address: string,
    amount: ?string,
    tokenId: ?string,
    parseError: ?string
  } => {
    let address = null;
    let amount = null;
    let uriTokenId = null;
    let parseError = null;

    let amounts = [];

    // add r? for payment request amounts

    // Parse out address and any other relevant data
    const parts = qrData.split("?");

    address = parts[0];
    const parameters = parts[1];
    if (parameters) {
      const parameterParts = parameters.split("&");
      parameterParts.forEach(async param => {
        const [name, value] = param.split("=");
        if (name.startsWith("amount")) {
          let currTokenId;
          let currAmount;
          if (value.includes("-")) {
            [currAmount, currTokenId] = value.split("-");
          } else {
            currAmount = value;
          }
          amounts.push({ tokenId: currTokenId, paramAmount: currAmount });
        }
        // Payment Request
        if (name === "r") {
          console.log("payment request detected");
          console.log(name);
          console.log(value);

          navigation.navigate("Bip70Confirm", {
            paymentURL: value
            // details
            // tokenId,
            // sendAmount: sendAmountCrypto,
            // toAddress
          });

          // catch this case earlier, and redirect to the BIP70 stack?

          // Check for payment url
          // TODO: Payment requests
          // if (value) {
          // let headers = {
          //   Accept: "application/bitcoincash-paymentrequest",
          //   "Content-Type": "application/octet-stream"
          // };

          // // Assume BCH, but fail over to SLP
          // let paymentResponse;
          // let paymentRequest;
          // let txType;

          // try {
          //   paymentResponse = await getAsArrayBuffer(value, headers); //paymentRequest.blob();
          //   txType = "BCH";
          // } catch (err) {
          //   headers = {
          //     ...headers,
          //     Accept: "application/simpleledger-paymentrequest"
          //   };
          //   paymentResponse = await getAsArrayBuffer(value, headers); //paymentRequest.blob();
          //   txType = "SLP";
          // }

          // const details = await decodePaymentRequest(paymentResponse);

          // console.log("after");
          // console.log(details);

          // // if BIP70, go straight to confirm screen with details + timer

          // navigation.navigate("ConfirmBIP70", {
          //   details
          //   // tokenId,
          //   // sendAmount: sendAmountCrypto,
          //   // toAddress
          // });

          //   amounts.push({ tokenId: currTokenId, paramAmount: currAmount });
        }
      });
    }

    // bitcoincash:qzcpa4yns9hz5x7tukcggrl009f8mmxnfv76nr8fex?r=https://pay.bitcoin.com/i/EcKnCr7aPpCMB5HRb99zF3
    // bitcoincash:?r=https://pay.bitcoin.com/i/EcKnCr7aPpCMB5HRb99zF3

    if (amounts.length > 1) {
      parseError =
        "Badger Wallet currently only supports sending one coin or token at a time.  The URI is requesting multiple coins.";
    } else if (amounts.length === 1) {
      const target = amounts[0];
      uriTokenId = target.tokenId;
      amount = target.paramAmount;
    }

    return {
      address,
      amount,
      parseError,
      tokenId: uriTokenId
    };
  };

  const handleAddressData = (parsedData: AddressData) => {
    setErrors([]);

    // Verify the type matches the screen we are on.
    if (parsedData.tokenId && parsedData.tokenId !== tokenId) {
      setErrors([
        "Sending different coin or token than selected, go to the target coin screen and try again"
      ]);
      return;
    }

    parsedData.parseError && setErrors([parsedData.parseError]);

    // If there's an amount, set the type to crypto
    parsedData.amount && setAmountType("crypto");
    if (parsedData.address) {
      setToAddress(parsedData.address);

      try {
        SLP.Address.isCashAddress(parsedData.address) ||
          SLP.Address.isSLPAddress(parsedData.address);
      } catch (e) {
        setErrors([e.message]);
      }
    }
    parsedData.amount && setSendAmount(parsedData.amount);
  };

  useEffect(() => {
    if (amountType === "crypto") {
      setSendAmountFiat(
        fiatRate
          ? (fiatRate * (sendAmountNumber || 0)).toFixed(
              currencyDecimalMap[fiatCurrency]
            )
          : 0
      );
      setSendAmountCrypto(sendAmount);
    }
    if (amountType === "fiat") {
      setSendAmountFiat(
        (sendAmountNumber || 0).toFixed(currencyDecimalMap[fiatCurrency])
      );
      setSendAmountCrypto(
        fiatRate && sendAmountNumber
          ? (sendAmountNumber / fiatRate).toFixed(8)
          : 0
      );
    }
  }, [sendAmountNumber, amountType, fiatRate, fiatCurrency, sendAmount]);

  const sendAmountFiatFormatted = formatFiatAmount(
    new BigNumber(sendAmountFiat),
    fiatCurrency,
    tokenId || "bch"
  );
  const sendAmountCryptoFormatted = sendAmountCrypto.length
    ? new BigNumber(sendAmountCrypto).toFormat()
    : "0";

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScreenWrapper>
        {qrOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>Scan QR Code</H2>
            <Spacer small />
            <View style={{ height: Dimensions.get("window").width - 12 }}>
              <QRCodeScanner
                cameraProps={{ ratio: "1:1", captureAudio: false }}
                fadeIn={false}
                onRead={e => {
                  const qrData = e.data;

                  const parsedData = parseQr(qrData);
                  handleAddressData(parsedData);
                  setQrOpen(false);
                }}
                cameraStyle={{
                  // padding 16 for each side
                  height: Dimensions.get("window").width - 32,
                  width: Dimensions.get("window").width - 32
                }}
              />
            </View>
            <Spacer />
            <Button
              nature="cautionGhost"
              onPress={() => setQrOpen(false)}
              text="Cancel Scan"
            />
          </QROverlayScreen>
        )}

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingRight: 16,
            paddingLeft: 16
          }}
        >
          <KeyboardAvoidingView
            behavior="position"
            keyboardVerticalOffset={Header.HEIGHT + 20}
          >
            <Spacer small />
            <TitleRow>
              <IconArea>
                <IconImage source={imageSource} />
              </IconArea>
              <H1>{coinName}</H1>
            </TitleRow>
            {tokenId && (
              <T size="tiny" center>
                {tokenId}
              </T>
            )}
            <Spacer small />
            {errors.length > 0 && (
              <>
                <ErrorContainer>
                  {errors.map(error => (
                    <T size="small" type="danger" center key={error}>
                      {error}
                    </T>
                  ))}
                </ErrorContainer>
                <Spacer small />
              </>
            )}
            <T center>Balance ({displaySymbol || "---"})</T>
            <H2 center>{availableFundsDisplay}</H2>
            {fiatDisplayTotal && (
              <T center type="muted">
                {fiatDisplayTotal}
              </T>
            )}
            <Spacer small />

            <T>Send To:</T>
            <Spacer tiny />
            <View>
              <StyledTextInput
                editable
                multiline
                placeholder={tokenId ? "simpleledger:" : "bitcoincash:"}
                autoComplete="off"
                autoCorrect={false}
                value={toAddress}
                onChangeText={text => {
                  setErrors([]);
                  setToAddress(text);
                }}
              />
            </View>

            <Spacer tiny />
            <ButtonArea>
              <StyledButton
                nature="ghost"
                onPress={async () => {
                  const content = await Clipboard.getString();
                  const parsedData = parseQr(content);

                  handleAddressData(parsedData);
                }}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-clipboard" size={18} /> Paste
                </T>
              </StyledButton>
              <StyledButton
                nature="ghost"
                text="Scan QR"
                onPress={() => setQrOpen(true)}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-qr-scanner" size={18} /> Scan QR
                </T>
              </StyledButton>
            </ButtonArea>
            <Spacer />

            <AmountRow>
              <T>Amount:</T>
              <View>
                <T size="small" monospace right>
                  {sendAmountCryptoFormatted || "0"} {displaySymbol}
                </T>
                {!tokenId && (
                  <T size="small" monospace right>
                    {sendAmountFiatFormatted}
                  </T>
                )}
              </View>
            </AmountRow>
            <Spacer tiny />
            <AmountInputRow>
              <AmountLabel>
                <T type="muted2" weight="bold">
                  {amountType === "crypto"
                    ? displaySymbol
                    : fiatCurrency.toUpperCase()}
                </T>
              </AmountLabel>
              <StyledTextInputAmount
                keyboardType="numeric"
                editable
                placeholder="0.0"
                autoComplete="off"
                autoCorrect={false}
                autoCapitalize="none"
                value={sendAmount}
                onChangeText={text => {
                  setErrors([]);
                  if (amountType === "crypto") {
                    setSendAmount(formatAmountInput(text, coinDecimals));
                  } else if (amountType === "fiat") {
                    setSendAmount(
                      formatAmountInput(text, currencyDecimalMap[fiatCurrency])
                    );
                  }
                }}
              />
            </AmountInputRow>

            <Spacer tiny />
            <AmountButtonArea>
              {!tokenId ? (
                <StyledButton nature="ghost" onPress={toggleAmountType}>
                  <T center spacing="loose" type="primary" size="small">
                    <Ionicons name="ios-swap" size={18} />{" "}
                    {amountType === "crypto"
                      ? fiatCurrency.toUpperCase()
                      : displaySymbol}
                  </T>
                </StyledButton>
              ) : (
                <View />
              )}
              <StyledButton
                nature="ghost"
                onPress={() => {
                  setSendAmount(
                    amountType === "crypto"
                      ? `${availableFunds}`
                      : `${fiatAmountTotal}`
                  );
                  setErrors([]);
                }}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-color-wand" size={18} /> Send Max
                </T>
              </StyledButton>
            </AmountButtonArea>

            <Spacer small />
          </KeyboardAvoidingView>
          <Spacer fill />
          <Spacer small />
          <ActionButtonArea>
            <Button onPress={goNextStep} text="Next Step" />
            <Spacer small />
            <Button
              nature="cautionGhost"
              onPress={() => navigation.navigate("Home")}
              text="Cancel"
            />
          </ActionButtonArea>
          <Spacer />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const address = getAddressSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);

  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(state, activeAccount.address);
  return {
    tokensById,
    balances,
    spotPrices,
    fiatCurrency,
    utxos
  };
};

const mapDispatchToProps = {
  updateTokensMeta
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SendSetupScreen);
