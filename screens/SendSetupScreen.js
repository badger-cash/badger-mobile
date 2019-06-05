// @flow
import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled, { css } from "styled-components";
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
import SLPSDK from "slp-sdk";

import { T, H1, H2, Button, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";

import {
  formatAmount,
  computeFiatAmount,
  formatFiatAmount
} from "../utils/balance-utils";
import { getTokenImage } from "../utils/token-utils";
import {
  currencySymbolMap,
  currencyDecimalMap,
  type CurrencyCode
} from "../utils/currency-utils";

const SLP = new SLPSDK();

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

// Only allow numbers and a single . in amount input
const formatAmountInput = (amount: string, maxDecimals: number): string => {
  const validCharacters = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  let decimalCount = 0;

  const valid = amount.split("").reduce((prev, curr, idx, array) => {
    // Only allow max 1 leading 0
    if (idx === 1 && curr === "0" && array[0] === "0") return prev;

    // Filter non-valid characters
    if (validCharacters.includes(curr)) return [...prev, curr];

    // Max of 1 decimal
    if (curr === "." && decimalCount === 0) {
      decimalCount++;
      return [...prev, curr];
    }
    return prev;
  }, []);

  // Add a 0 if first digit is a '.'
  const maybeZero = valid[0] && valid[0] === "." ? ["0", ...valid] : valid;

  // Restrict decimals
  const decimalIndex = maybeZero.indexOf(".");
  const decimalAdjusted =
    decimalIndex >= 0
      ? maybeZero.slice(0, decimalIndex + maxDecimals + 1)
      : maybeZero;

  return decimalAdjusted.join("");
};

const parseQr = (qrData: string): { address: string, amount: ?string } => {
  let address = null;
  let amount = null;

  // Parse out address and any BIP21 relevant data
  const parts = qrData.split("?");

  address = parts[0];
  const parameters = parts[1];
  if (parameters) {
    const parameterParts = parameters.split("&");
    parameterParts.map(param => {
      const [name, value] = param.split("=");
      if (name === "amount") {
        amount = value;
      }
    });
  }
  return {
    address,
    amount
  };
};

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  balances: Balances,
  spotPrices: any,
  fiatCurrency: CurrencyCode,
  navigation: {
    navigate: Function,
    state?: { params: { symbol: string, tokenId: ?string } }
  }
};

const SendSetupScreen = ({
  navigation,
  tokensById,
  balances,
  spotPrices,
  fiatCurrency
}: Props) => {
  const [qrOpen, setQrOpen] = useState(false);

  const [toAddress, setToAddress] = useState("");

  const [sendAmount, setSendAmount] = useState("");
  const [sendAmountFiat, setSendAmountFiat] = useState("0");
  const [sendAmountCrypto, setSendAmountCrypto] = useState("0");
  const [amountType, setAmountType] = useState("crypto");

  const [errors, setErrors] = useState([]);

  // Todo - Handle if send with nothing pre-selected on navigation
  const { symbol, tokenId } = (navigation.state && navigation.state.params) || {
    symbol: null,
    tokenId: null
  };

  let availableAmount = 0;
  if (tokenId) {
    availableAmount = balances.slpTokens[tokenId];
  } else {
    const availableRaw = balances.satoshisAvailable.minus(546);

    if (availableRaw.lte(0)) {
      availableAmount = new BigNumber(0);
    } else {
      availableAmount = availableRaw;
    }
  }

  const coinDecimals = tokenId ? tokensById[tokenId].decimals : 8;

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

  const coinName = !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  const imageSource = getTokenImage(tokenId);

  const toggleAmountType = () => {
    if (tokenId) return;
    setAmountType(amountType === "crypto" ? "fiat" : "crypto");
  };

  const goNextStep = () => {
    const addressFormat = SLP.Address.detectAddressFormat(toAddress);
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

    if (!hasErrors) {
      navigation.navigate("SendConfirm", {
        symbol,
        tokenId,
        sendAmount: sendAmountCrypto,
        toAddress
      });
    }
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
  }, [sendAmountNumber, amountType, fiatRate]);

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
                  const { address, amount } = parseQr(qrData);

                  // If there's an amount, set the type to crypto
                  amount && setAmountType("crypto");

                  address && setToAddress(address);
                  amount && setSendAmount(amount);

                  setErrors([]);
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
            <T center>Balance ({symbol})</T>
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
                  setErrors([]);
                  setToAddress(content);
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
                  {sendAmountCryptoFormatted || "0"} {symbol}
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
                    ? symbol
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
                      : symbol}
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
  return {
    tokensById,
    balances,
    spotPrices,
    fiatCurrency
  };
};

export default connect(mapStateToProps)(SendSetupScreen);
