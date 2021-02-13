import React, { useState, useEffect } from "react";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import {
  Clipboard,
  SafeAreaView,
  ScrollView,
  Dimensions,
  View,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
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

import { TokenData } from "../data/tokens/reducer";

import { addressToSlp } from "../utils/account-utils";
import { getTokenImage } from "../utils/token-utils";
import { formatAmountInput, formatFiatAmount } from "../utils/balance-utils";
import { currencyDecimalMap } from "../utils/currency-utils";
import { FullState } from "../data/store";

import lang from "../_locales/index";
var tran = new lang("RequestScreen");

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
  width: 64;
  height: 64;
  border-radius: 32;
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
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  width: 100%;
  background-color: white;
  align-items: center;
  justify-content: center;
  opacity: 0.98;
  z-index: 2;
`;

type PropsFromParent = NavigationScreenProps & {
  navigation: {
    state?: {
      params: {
        symbol: string;
        tokenId: string | null | undefined;
      };
    };
  };
};

const mapStateToProps = (state: FullState) => {
  const tokensById = tokensByIdSelector(state);
  const fiatCurrency = currencySelector(state);
  const spotPrices = spotPricesSelector(state);
  const address = getAddressSelector(state);
  const addressSlp = getAddressSlpSelector(state);

  return {
    address,
    addressSlp,
    tokensById,
    fiatCurrency,
    spotPrices
  };
};

const mapDispatchToProps = {};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

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

  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestAmountFiat, setRequestAmountFiat] = useState("0");
  const [requestAmountCrypto, setRequestAmountCrypto] = useState("0");
  const [amountType, setAmountType] = useState("crypto");
  const [baseAddress, setBaseAddress] = useState(
    tokenId ? addressSlp : address
  );
  const [requestUri, setRequestUri] = useState(baseAddress);

  const totalWidth = Dimensions.get("window").width;
  const QRSize = totalWidth > 300 ? totalWidth * 0.6 : totalWidth * 0.7;

  useEffect(() => {
    if (!addressSlp || !tokenId) return;

    const convertAddress = async () => {
      const convertedAddress = await addressToSlp(addressSlp);
      setBaseAddress(convertedAddress);
    };

    convertAddress();
  }, [addressSlp, tokenId]);

  useEffect(() => {
    setCopiedMessage(null);
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
  }, [tokenId, baseAddress, requestAmountCrypto]);

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
          : "0"
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
          : "0"
      );
    }
  }, [requestAmountNumber, amountType, fiatRate, fiatCurrency, requestAmount]);

  if (!symbol && !tokenId) {
    navigation.goBack();
  }

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
    <SafeAreaView
      style={{
        height: "100%"
      }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingRight: 16,
          paddingLeft: 16
        }}
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
            autoCompleteType="off"
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
          {tran.getStr("Requesting")}
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
              Clipboard.setString(requestUri);
              setCopiedMessage(tran.getStr("Copied_to_clipboard"));
            }
          }}
        >
          <QRHolder>
            <QRCode
              value={requestUri}
              size={QRSize}
              color="black"
              backgroundColor="white"
            />
            {!isShowing && (
              <QROverlay>
                <T type="accent" center>
                  {tran.getStr("Amount_Required")}
                </T>
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

export default connector(RequestSetupScreen);
