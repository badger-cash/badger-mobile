// @flow

import React from "react";
import styled from "styled-components";

import { View, Image, TouchableOpacity } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T } from "../../atoms";

import { getTokenImage } from "../../utils/token-utils";
type Props = {
  amount: string,
  extra: string,
  name: string,
  ticker: string,
  tokenId: ?string,
  valueDisplay: ?string,
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

const CoinRow = ({
  ticker,
  name,
  amount,
  extra,
  tokenId,
  valueDisplay,
  onPress
}: Props) => {
  const imageSource = getTokenImage(tokenId);

  return (
    <Outter onPress={onPress}>
      <IconArea>
        <IconImage source={imageSource} />
      </IconArea>
      <InfoArea>
        <T>
          {ticker}
          <T type="muted2"> - {name}</T>
        </T>
        <T size="large">{amount}</T>
        {valueDisplay && (
          <T type="muted2" size="small">
            {valueDisplay}
          </T>
        )}
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

const CoinRowHeader = ({ children }: { children: string }) => {
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
