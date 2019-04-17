// @flow

import React from "react";
import styled from "styled-components";

import { View, Image, TouchableOpacity } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T } from "../../atoms";

import BitcoinCashImage from "../../assets/images/icon.png";

type Props = {
  ticker: string,
  name: string,
  amount: string,
  extra: string,
  tokenId: ?string,
  onPress: Function
};

const Outter = styled(TouchableOpacity)`
  padding: 14px 10px;
  flex-direction: row;
  border-bottom-color: ${props => props.theme.fg700};
  border-bottom-width: 1px;
`;

const IconArea = styled(View)`
  justify-content: center;
  margin-right: 10px;
`;

const ArrowArea = styled(View)`
  justify-content: center;
  margin-right: 10px;
`;
const IconImage = styled(Image)`
  width: 36;
  height: 36;
  border-radius: 18;
  overflow: hidden;
`;

const InfoArea = styled(View)`
  flex: 1;
`;

const CoinRow = ({ ticker, name, amount, extra, tokenId, onPress }: Props) => {
  const imageSource =
    ticker === "BCH" && !tokenId
      ? BitcoinCashImage
      : { uri: makeBlockie(tokenId) };

  return (
    <Outter onPress={onPress}>
      <IconArea>
        <IconImage source={imageSource} />
      </IconArea>
      <InfoArea>
        <T>
          {ticker} - {name}
        </T>
        <T size="large">{amount}</T>
      </InfoArea>
      <ArrowArea>
        <Ionicons name="ios-arrow-forward" size={24} />
      </ArrowArea>
    </Outter>
  );
};

const HeaderWrapper = styled(View)`
  padding: 0px 10px;
  margin-top: 15px;
`;

const CoinRowHeader = ({ children }) => {
  return (
    <HeaderWrapper>
      <T size="small" type="muted">
        {children}
      </T>
    </HeaderWrapper>
  );
};

export { CoinRowHeader };
export default CoinRow;
