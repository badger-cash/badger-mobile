import React, { useState, useEffect, useMemo, useCallback } from "react";
import { connect, ConnectedProps } from "react-redux";
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
import { Header, NavigationScreenProps } from "react-navigation";
import BigNumber from "bignumber.js";

import QRCodeScanner from "react-native-qrcode-scanner";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T, H1, H2, Button, Spacer } from "../atoms";

import { TokenData } from "../data/tokens/reducer";
import { UTXO } from "../data/utxos/reducer";

import { updateTokensMeta } from "../data/tokens/actions";

import { getAddressSelector } from "../data/accounts/selectors";
import { balancesSelector, Balances } from "../data/selectors";
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
import { currencyDecimalMap, CurrencyCode } from "../utils/currency-utils";

import { SLP } from "../utils/slp-sdk-utils";
import { FullState } from "../data/store";

import lang from "../_locales/index";
var tran = new lang("SendSetupScreen");

type PropsFromParent = NavigationScreenProps & {
  navigation: {
    state?: {
      params: {
        tokenId?: string | null;
        uriAmount?: string | null;
        uriAddress?: string | null;
        uriError?: string | null;
      };
    };
  };
};

const mapStateToProps = (state: FullState) => {
  const address = getAddressSelector(state);
  const balances = balancesSelector(state, address);
  const tokensById = tokensByIdSelector(state);
  const spotPrices = spotPricesSelector(state);
  const fiatCurrency = currencySelector(state);
  const activeAccount = activeAccountSelector(state);
  const utxos = utxosByAccountSelector(
    state,
    activeAccount && activeAccount.address
  );
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

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

type AddressData = {
  tokenId?: string | null;
  parseError?: string | null;
  amount?: string | null;
  address?: string | null;
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

  const [errors, setErrors] = useState<string[]>([] as string[]);

  const { tokenId, uriAddress, uriAmount, uriError } = (navigation.state &&
    navigation.state.params) || {
    tokenId: null,
    uriAddress: null,
    uriAmount: null,
    uriError: null
  };

  // Set initial values from paramaters, used when opening from URI
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

  const displaySymbol = useMemo(() => {
    if (tokenId) {
      if (tokensById[tokenId]) {
        return tokensById[tokenId].symbol;
      }
      return "---";
    }
    return "BCH";
  }, [tokensById, tokenId]);

  useEffect(() => {
    // Fetch token Metadata if it is unknown
    if (!tokenId) return;

    if (!tokensById[tokenId]) {
      updateTokensMeta([tokenId]);
    }
  }, [tokenId, tokensById, updateTokensMeta]);

  const availableAmount = useMemo(() => {
    let result = new BigNumber(0);

    if (tokenId) {
      result = balances.slpTokens[tokenId];
    } else {
      const spendableUTXOS = utxos.filter(utxo => utxo.spendable);
      const allUTXOFee = SLP.BitcoinCash.getByteCount(
        {
          P2PKH: spendableUTXOS.length
        },
        {
          P2PKH: 2
        }
      );
      // Available = total satoshis - fee for including all UTXO
      const availableRaw = balances.satoshisAvailable.minus(allUTXOFee);

      if (availableRaw.lte(0)) {
        result = new BigNumber(0);
      } else {
        result = availableRaw;
      }
    }

    if (!result) {
      result = new BigNumber(0);
    }

    return result;
  }, [balances.slpTokens, balances.satoshisAvailable, tokenId, utxos]);

  const coinDecimals = useMemo(() => {
    if (tokenId && tokensById[tokenId]) {
      if (tokensById[tokenId]) {
        return tokensById[tokenId].decimals;
      }
      // Unknown, don't assume
      return null;
    }
    return 8;
  }, [tokenId, tokensById]);

  const availableFunds = useMemo(() => {
    if (coinDecimals == null) {
      return null;
    }
    return availableAmount.shiftedBy(-1 * coinDecimals);
  }, [availableAmount, coinDecimals]);

  const availableFundsDisplay = useMemo(() => {
    return formatAmount(availableAmount, coinDecimals);
  }, [availableAmount, coinDecimals]);

  const fiatAmountTotal = useMemo(() => {
    if (tokenId) {
      return computeFiatAmount(
        availableAmount,
        spotPrices,
        fiatCurrency,
        tokenId
      );
    } else {
      return computeFiatAmount(
        availableAmount,
        spotPrices,
        fiatCurrency,
        "bch"
      );
    }
  }, [tokenId, availableAmount, fiatCurrency, spotPrices]);

  const fiatDisplayTotal = !tokenId
    ? formatFiatAmount(fiatAmountTotal, fiatCurrency, tokenId || "bch")
    : null;

  const fiatRate = useMemo(() => {
    if (tokenId) {
      return null;
    }

    return (
      spotPrices["bch"][fiatCurrency] && spotPrices["bch"][fiatCurrency].rate
    );
  }, [spotPrices, tokenId, fiatCurrency]);

  const coinName = useMemo(() => {
    if (!tokenId) {
      return "Bitcoin Cash";
    }

    const tokenName =
      tokenId && tokensById[tokenId] ? tokensById[tokenId].name : "---";
    return tokenName;
  }, [tokenId, tokensById]);

  const imageSource = useMemo(() => getTokenImage(tokenId), [tokenId]);

  const toggleAmountType = useCallback(() => {
    if (tokenId) return;
    setAmountType(amountType === "crypto" ? "fiat" : "crypto");
  }, [tokenId, amountType]);

  const goNextStep = useCallback(() => {
    let addressFormat = null;

    try {
      addressFormat = SLP.Address.detectAddressFormat(toAddress);
    } catch (e) {
      setErrors([tran.getStr("Msg_Error_Invalid_address")]);
      return;
    }

    let hasErrors = false;

    if (tokenId && !["slpaddr"].includes(addressFormat)) {
      setErrors([tran.getStr("Msg_Error_Can_only_send_SLP_tokens")]);
      hasErrors = true;
    } else if (!tokenId && !["cashaddr"].includes(addressFormat)) {
      setErrors([tran.getStr("Msg_Error_Can_only_send_BCH")]);
      hasErrors = true;
    }

    if (!availableFunds || new BigNumber(sendAmountCrypto).gt(availableFunds)) {
      setErrors([tran.getStr("Msg_Error_Cannot_send_more_available")]);
      hasErrors = true;
    }

    if (!sendAmount || !sendAmountCrypto) {
      setErrors([tran.getStr("Msg_Error_Amount_required")]);
      hasErrors = true;
    }

    if (!hasErrors) {
      navigation.navigate("SendConfirm", {
        tokenId,
        sendAmount: sendAmountCrypto,
        toAddress
      });
    }
  }, [
    availableFunds,
    navigation,
    sendAmount,
    sendAmountCrypto,
    toAddress,
    tokenId
  ]);

  // Parse out address and any other relevant data
  const parseQr = useCallback(
    (
      qrData: string
    ): {
      address: string;
      amount?: string | null;
      tokenId?: string | null;
      parseError?: string | null;
    } | null => {
      let address = null;
      let amount = null;
      let uriTokenId = null;
      let parseError = null;
      let amounts = [] as { tokenId?: string; paramAmount: string }[];

      let quitEarly = false;

      const parts = qrData.split("?");
      address = parts[0];
      const parameters = parts[1];

      if (parameters) {
        const parameterParts = parameters.split("&");
        parameterParts.forEach(async param => {
          const [name, value] = param.split("=");

          if (name === "r") {
            // BIP70 detected, go to BIP70 flow
            setToAddress("");
            quitEarly = true;
            navigation.navigate("Bip70Confirm", {
              paymentURL: value
            });
          }

          if (name.startsWith("amount")) {
            // Parse request amount from URI
            let currTokenId;
            let currAmount;

            if (value.includes("-")) {
              [currAmount, currTokenId] = value.split("-");
            } else {
              currAmount = value;
            }

            amounts.push({
              tokenId: currTokenId,
              paramAmount: currAmount
            });
          }
        });
      }

      if (amounts.length > 1) {
        parseError =
          "Badger Wallet currently only supports sending one coin or token at a time.  The URI is requesting multiple coins.";
      } else if (amounts.length === 1) {
        const target = amounts[0];
        uriTokenId = target.tokenId;
        amount = target.paramAmount;
      }

      if (quitEarly) {
        return null;
      }

      return {
        address,
        amount,
        parseError,
        tokenId: uriTokenId
      };
    },
    [navigation]
  );
  const handleAddressData = useCallback(
    (parsedData: AddressData) => {
      setErrors([]);

      // Verify the type matches the screen we are on.
      if (parsedData.tokenId && parsedData.tokenId !== tokenId) {
        setErrors([tran.getStr("Msg_Error_Sending_different_coin_or_token")]);
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
    },
    [tokenId]
  );
  useEffect(() => {
    const sendAmountNumber = parseFloat(sendAmount);

    if (amountType === "crypto") {
      setSendAmountFiat(
        fiatRate
          ? (fiatRate * (sendAmountNumber || 0)).toFixed(
              currencyDecimalMap[fiatCurrency]
            )
          : "0"
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
          : "0"
      );
    }
  }, [amountType, fiatRate, fiatCurrency, sendAmount]);

  const sendAmountFiatFormatted = useMemo(() => {
    return formatFiatAmount(
      new BigNumber(sendAmountFiat),
      fiatCurrency,
      tokenId || "bch"
    );
  }, [fiatCurrency, tokenId, sendAmountFiat]);

  const sendAmountCryptoFormatted = useMemo(() => {
    if (sendAmountCrypto.length) {
      return new BigNumber(sendAmountCrypto).toFormat();
    }
    return "0";
  }, [sendAmountCrypto]);

  return (
    <SafeAreaView
      style={{
        // padding 16 for each side
        flex: 1
      }}
    >
      <ScreenWrapper>
        {qrOpen && (
          <QROverlayScreen>
            <Spacer small />
            <H2 center>{tran.getStr("Scan_QR_Code")}</H2>
            <Spacer small />

            <View
              style={{
                height: Dimensions.get("window").width - 12
              }}
            >
              <QRCodeScanner
                cameraProps={{
                  ratio: "1:1",
                  captureAudio: false
                }}
                fadeIn={false}
                onRead={e => {
                  const qrData = e.data;
                  const parsedData = parseQr(qrData);

                  if (parsedData) {
                    handleAddressData(parsedData);
                  }

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
              text={tran.getStr("Btn_Cancel_Scan")}
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
              <H1>{coinName}</H1>
            </TitleRow>
            <IconArea>
              <IconImage source={imageSource} />
            </IconArea>
            {tokenId && (
              <>
                <Spacer minimal />
                <T size="tiny" center>
                  {tokenId}
                </T>
              </>
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
            <T center>
              {tran.getStr("Balance")} ({displaySymbol || "---"})
            </T>
            <H2 center>{availableFundsDisplay}</H2>

            {fiatDisplayTotal && (
              <T center type="muted">
                {fiatDisplayTotal}
              </T>
            )}
            <Spacer small />

            <T>{tran.getStr("Send_To")}:</T>
            <Spacer tiny />
            <View>
              <StyledTextInput
                editable
                multiline
                placeholder={tokenId ? "simpleledger:" : "bitcoincash:"}
                autoCompleteType="off"
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

                  if (parsedData) {
                    handleAddressData(parsedData);
                  }
                }}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-clipboard" size={18} />{" "}
                  {tran.getStr("Paste")}
                </T>
              </StyledButton>
              <StyledButton
                nature="ghost"
                text={tran.getStr("Btn_Scan_QR")}
                onPress={() => setQrOpen(true)}
              >
                <T center spacing="loose" type="primary" size="small">
                  <Ionicons name="ios-qr-scanner" size={18} />{" "}
                  {tran.getStr("Scan_QR")}
                </T>
              </StyledButton>
            </ButtonArea>
            <Spacer />

            <AmountRow>
              <T>{tran.getStr("Amount")}:</T>
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
                autoCompleteType="off"
                autoCorrect={false}
                autoCapitalize="none"
                value={sendAmount}
                onChangeText={text => {
                  setErrors([]);

                  if (amountType === "crypto") {
                    coinDecimals != null &&
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
                  <Ionicons name="ios-color-wand" size={18} />{" "}
                  {tran.getStr("Send_Max")}
                </T>
              </StyledButton>
            </AmountButtonArea>

            <Spacer small />
          </KeyboardAvoidingView>
          <Spacer fill />
          <Spacer small />
          <ActionButtonArea>
            <Button onPress={goNextStep} text={tran.getStr("Btn_Next_Step")} />
            <Spacer small />
            <Button
              nature="cautionGhost"
              onPress={() => navigation.navigate("Home")}
              text={tran.getStr("Btn_Cancel")}
            />
          </ActionButtonArea>
          <Spacer />
        </ScrollView>
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default connector(SendSetupScreen);
