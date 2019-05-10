// @flow
import React, { useState } from "react";
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

import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";
import SLPSDK from "slp-sdk";

import { T, H1, H2, Button, Spacer } from "../atoms";

import { type TokenData } from "../data/tokens/reducer";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, type Balances } from "../data/selectors";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { formatAmount } from "../utils/balance-utils";
import { getTokenImage } from "../utils/token-utils";

const SLP = new SLPSDK();

const StyledTextInput = styled(TextInput)`
  border-color: ${props => props.theme.accent500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 3px;
  padding: 16px 8px;
`;

const ScreenWrapper = styled(View)`
  position: relative;
  margin: 0 16px;
  flex: 1;
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

const MaxButtonArea = styled(View)`
  align-items: flex-end;
`;

const QROverlayScreen = styled(View)`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: ${Dimensions.get("window").width - 32}px;
  height: ${Dimensions.get("window").height}px;
  z-index: 1;
  background-color: ${props => props.theme.bg900};
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

const ErrorContainer = styled(View)`
  border-color: ${props => props.theme.danger500};
  border-width: 1px;
  border-radius: 3px;
  padding: 8px;
  background-color: ${props => props.theme.danger700};
`;

type Props = {
  tokensById: { [tokenId: string]: TokenData },
  balances: Balances,
  navigation: {
    navigate: Function,
    state?: { params: { symbol: string, tokenId: ?string } }
  }
};

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

const parseQr = (qrData: string) => {
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

const SendSetupScreen = ({ navigation, tokensById, balances }: Props) => {
  const [toAddress, setToAddress] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [errors, setErrors] = useState([]);

  // Todo - Handle if send with nothing pre-selected on navigation
  const { symbol, tokenId } = (navigation.state && navigation.state.params) || {
    symbol: null,
    tokenId: null
  };

  const availableAmount = tokenId
    ? balances.slpTokens[tokenId]
    : balances.satoshisAvailable - 546;

  const adjustDecimals = tokenId ? tokensById[tokenId].decimals : 8;

  const availableFunds = parseFloat(
    formatAmount(availableAmount, adjustDecimals)
  );

  const coinName = !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;

  const imageSource = getTokenImage(tokenId);

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

                  address && setToAddress(address);
                  amount && setSendAmount(amount);

                  setErrors([]);
                  setQrOpen(false);
                }}
                cameraStyle={{
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Spacer small />
          <KeyboardAvoidingView behavior="position">
            <H1 center>Create Transaction</H1>
            <Spacer />
            <IconArea>
              <IconImage source={imageSource} />
            </IconArea>
            <Spacer tiny />
            <H2 center>
              {coinName} ({symbol})
            </H2>
            {tokenId && (
              <T size="tiny" center>
                {tokenId}
              </T>
            )}
            <Spacer />

            <T>Send To:</T>
            <Spacer tiny />
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
            <Spacer tiny />
            <ButtonArea>
              <StyledButton
                style={{ marginRight: 5 }}
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

            <T>Amount:</T>
            <T size="small">
              {availableFunds} {symbol} available
            </T>
            <Spacer tiny />
            <StyledTextInput
              keyboardType="numeric"
              editable
              placeholder="0.0"
              autoComplete="off"
              autoCorrect={false}
              autoCapitalize="none"
              value={sendAmount}
              onChangeText={text => {
                setErrors([]);
                setSendAmount(formatAmountInput(text, adjustDecimals));
              }}
            />
            <Spacer tiny />
            <MaxButtonArea>
              <StyledButton
                nature="ghost"
                onPress={() => {
                  setSendAmount(`${availableFunds}`);
                  setErrors([]);
                }}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-color-wand" size={18} /> Send Max
                </T>
              </StyledButton>
            </MaxButtonArea>
          </KeyboardAvoidingView>

          {errors.length > 0 ? (
            <>
              <Spacer small />
              <ErrorContainer>
                {errors.map(error => (
                  <T size="small" type="danger" center key={error}>
                    {error}
                  </T>
                ))}
              </ErrorContainer>
              <Spacer fill />
            </>
          ) : (
            <Spacer fill />
          )}
          <Spacer small />
          <ActionButtonArea>
            <Button
              onPress={() => {
                const addressFormat = SLP.Address.detectAddressFormat(
                  toAddress
                );
                let hasErrors = false;
                if (
                  tokenId &&
                  !["slpaddr", "cashaddr", "legacy"].includes(addressFormat)
                ) {
                  setErrors([
                    "Can only send SLP tokens to SimpleLedger addresses.  The to address should begin with `simpleledger:`"
                  ]);
                  hasErrors = true;
                } else if (
                  !tokenId &&
                  !["cashaddr", "legacy"].includes(addressFormat)
                ) {
                  setErrors([
                    "Can only send Bitcoin Cash (BCH) to cash addresses, the to address should begin with `bitcoincash:`"
                  ]);
                  hasErrors = true;
                }

                if (parseFloat(sendAmount) > availableFunds) {
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
                    sendAmount,
                    toAddress
                  });
                }
              }}
              text="Next Step"
            />
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
  return {
    tokensById,
    balances
  };
};

export default connect(mapStateToProps)(SendSetupScreen);
