// @flow

import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  Clipboard,
  SafeAreaView,
  ScrollView,
  View,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import BigNumber from "bignumber.js";
import QRCode from "react-native-qrcode-svg";

import { Button, T, H1, Spacer, H2 } from "../atoms";

import { tokensByIdSelector } from "../data/tokens/selectors";
import { spotPricesSelector, currencySelector } from "../data/prices/selectors";
import {
  getAddressSelector,
  getAddressSlpSelector
} from "../data/accounts/selectors";

import { type TokenData } from "../data/tokens/reducer";

import { addressToSlp } from "../utils/account-utils";
import { getTokenImage } from "../utils/token-utils";
import { formatAmountInput, formatFiatAmount } from "../utils/balance-utils";
import {
  currencySymbolMap,
  currencyDecimalMap,
  type CurrencyCode
} from "../utils/currency-utils";

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
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

const AmountRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
`;

const AmountInputRow = styled(View)`
  flex-direction: row;
  justify-content: space-between;
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

const AmountButtonArea = styled(View)`
  flex-direction: row;
  justify-content: space-between;
`;

const QRHolder = styled(View)`
  justify-content: center;
  align-items: center;
  padding: 0 16px;
  overflow: hidden;
  position: relative;
`;

const QROverlay = styled(View)`
  position: absolute;
  height: 150px;
  width: 150px;
  background-color: white;
  align-items: center;
  justify-content: center;
  padding: 15px;
  opacity: 0.98;
  z-index: 2;
`;

type Props = {
  navigation: {
    navigate: Function,
    goBack: Function,
    state?: { params: { symbol: string, tokenId: ?string } }
  },
  tokensById: { [tokenId: string]: TokenData },
  fiatCurrency: CurrencyCode,
  spotPrices: any,
  address: string,
  addressSlp: string
};

const RequestSetupScreen = ({
  address,
  addressSlp,
  navigation,
  tokensById,
  fiatCurrency,
  spotPrices
}: Props) => {
  const { symbol, tokenId } = (navigation.state && navigation.state.params) || {
    symbol: null,
    tokenId: null
  };
  if (!symbol && !tokenId) {
    navigation.goBack();
    return;
  }

  const [copiedMessage, setCopiedMessage] = useState(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestAmountFiat, setRequestAmountFiat] = useState("0");
  const [requestAmountCrypto, setRequestAmountCrypto] = useState("0");
  const [amountType, setAmountType] = useState("crypto");
  const [baseAddress, setBaseAddress] = useState(
    tokenId ? addressSlp : address
  );
  const [requestUri, setRequestUri] = useState(baseAddress);

  useEffect(() => {
    if (!addressSlp || !tokenId) return;
    const convertAddress = async () => {
      const convertedAddress = await addressToSlp(addressSlp);
      setBaseAddress(convertedAddress);
    };
    convertAddress();
  }, [addressSlp]);

  useEffect(() => {
    let nextRequestUri;
    if (tokenId) {
      nextRequestUri = `${baseAddress}?amount1=${requestAmountCrypto ||
        0}-${tokenId}`;
    } else {
      nextRequestUri = requestAmountCrypto
        ? `${baseAddress}?amount=${requestAmountCrypto}`
        : baseAddress;
    }
    setRequestUri(nextRequestUri);
  });

  const requestAmountNumber = parseFloat(requestAmount);
  const fiatRate = !tokenId
    ? spotPrices["bch"][fiatCurrency] && spotPrices["bch"][fiatCurrency].rate
    : null;

  useEffect(() => {
    if (amountType === "crypto") {
      setRequestAmountFiat(
        fiatRate
          ? (fiatRate * (requestAmountNumber || 0)).toFixed(
              currencyDecimalMap[fiatCurrency]
            )
          : 0
      );
      setRequestAmountCrypto(requestAmount);
    }
    if (amountType === "fiat") {
      setRequestAmountFiat(
        (requestAmountNumber || 0).toFixed(currencyDecimalMap[fiatCurrency])
      );
      setRequestAmountCrypto(
        fiatRate && requestAmountNumber
          ? (requestAmountNumber / fiatRate).toFixed(8)
          : 0
      );
    }
  }, [requestAmountNumber, amountType, fiatRate]);

  const toggleAmountType = () => {
    if (tokenId) return;
    setAmountType(amountType === "crypto" ? "fiat" : "crypto");
  };

  const imageSource = getTokenImage(tokenId);
  const coinName = !tokenId ? "Bitcoin Cash" : tokensById[tokenId].name;
  const coinDecimals = tokenId ? tokensById[tokenId].decimals : 8;

  const requestAmountFiatFormatted = formatFiatAmount(
    new BigNumber(requestAmountFiat),
    fiatCurrency,
    tokenId || "bch"
  );
  const requestAmountCryptoFormatted = requestAmountCrypto.length
    ? new BigNumber(requestAmountCrypto).toFormat()
    : "0";

  const isShowing = !tokenId || requestAmountCrypto;

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingRight: 16,
          paddingLeft: 16
        }}
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
        <Spacer />
        <AmountRow>
          <T>Amount:</T>
          <View>
            <T size="small" monospace right>
              {requestAmountCryptoFormatted || "0"} {symbol}
            </T>
            {!tokenId && (
              <T size="small" monospace right>
                {requestAmountFiatFormatted}
              </T>
            )}
          </View>
        </AmountRow>
        <Spacer tiny />
        <AmountInputRow>
          <AmountLabel>
            <T type="muted2" weight="bold">
              {amountType === "crypto" ? symbol : fiatCurrency.toUpperCase()}
            </T>
          </AmountLabel>
          <StyledTextInputAmount
            keyboardType="numeric"
            editable
            placeholder="0.0"
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            value={requestAmount}
            onChangeText={text => {
              if (amountType === "crypto") {
                setRequestAmount(formatAmountInput(text, coinDecimals));
              } else if (amountType === "fiat") {
                setRequestAmount(
                  formatAmountInput(text, currencyDecimalMap[fiatCurrency])
                );
              }
            }}
          />
        </AmountInputRow>
        <Spacer tiny />
        <AmountButtonArea>
          {!tokenId ? (
            <Button nature="ghost" onPress={toggleAmountType}>
              <T center spacing="loose" type="primary" size="small">
                <Ionicons name="ios-swap" size={18} />{" "}
                {amountType === "crypto" ? fiatCurrency.toUpperCase() : symbol}
              </T>
            </Button>
          ) : (
            <View />
          )}
          <View />
        </AmountButtonArea>
        <Spacer small />
        <T size="xsmall" type="muted2">
          {requestUri}
        </T>
        <Spacer />
        <T center size="small">
          Requesting
        </T>
        <Spacer tiny />
        <H2 center monospace>
          {requestAmountCryptoFormatted} {symbol}
        </H2>
        {!tokenId && (
          <>
            <Spacer minimal />
            <T type="muted" monospace center>
              {requestAmountFiatFormatted}
            </T>
          </>
        )}
        <Spacer />

        <TouchableOpacity
          onPress={() => {
            if (isShowing) {
              Clipboard.setString(address);
              setCopiedMessage("Copied to clipboard");
            }
          }}
        >
          <QRHolder>
            <QRCode
              value={requestUri}
              size={125}
              bgColor="black"
              fgColor="white"
            />
            {!isShowing && (
              <QROverlay>
                <T type="accent">Amount Required</T>
              </QROverlay>
            )}
          </QRHolder>
          <Spacer tiny />
          <T center type="primary">
            {copiedMessage}
          </T>
        </TouchableOpacity>
        <Spacer />
      </ScrollView>
    </SafeAreaView>
  );
};

const mapStateToProps = state => {
  const tokensById = tokensByIdSelector(state);
  const fiatCurrency = currencySelector(state);
  const spotPrices = spotPricesSelector(state);
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);
  return { address, addressSlp, tokensById, fiatCurrency, spotPrices };
};

const mapDispatchToProps = {};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RequestSetupScreen);
