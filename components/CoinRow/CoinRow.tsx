import React from "react";
import styled from "styled-components";

import { View, Image, TouchableOpacity } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import { T, Spacer } from "../../atoms";

import { getTokenImage } from "../../utils/token-utils";

interface Props {
  amount: string;
  name: string;
  ticker: string;
  tokenId?: string | null;
  valueDisplay?: string | null;
  onPress(): void;
}

const Outer = styled(TouchableOpacity)<{ onPress(): void }>`
  padding: 16px 16px;
  flex-direction: row;
  border-bottom-color: ${props => props.theme.fg700};
  border-bottom-width: 1px;
`;

const IconArea = styled(View)`
  justify-content: center;
  margin-right: 12px;
`;

const ArrowArea = styled(View)`
  justify-content: center;
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
  tokenId,
  valueDisplay,
  onPress
}: Props) => {
  const imageSource = getTokenImage(tokenId);

  let [amountWhole, amountDecimal] = (amount && amount.split(".")) || [
    null,
    null
  ];

  amountDecimal =
    amountDecimal && [...amountDecimal].every(v => v === "0")
      ? null
      : amountDecimal;

  return (
    <Outer onPress={onPress}>
      <IconArea>
        <IconImage source={imageSource} />
      </IconArea>
      <InfoArea>
        <T>
          {ticker}
          <T type="muted2"> - {name}</T>
        </T>
        <Spacer minimal />
        <T size="large">
          {amountWhole}
          {amountDecimal && <T type="muted">{`.${amountDecimal}`}</T>}
        </T>
        {valueDisplay && (
          <T type="muted2" size="small">
            {valueDisplay}
          </T>
        )}
      </InfoArea>
      <ArrowArea>
        <T type="muted2">
          <Ionicons name="ios-arrow-forward" size={20} />
        </T>
      </ArrowArea>
    </Outer>
  );
};

const HeaderWrapper = styled(View)`
  padding: 0px 16px;
  margin-top: 25px;
`;

const CoinRowHeader = ({ children }: { children: string }) => {
  return (
    <HeaderWrapper>
      <T type="muted2">{children}</T>
    </HeaderWrapper>
  );
};

export { CoinRowHeader };
export default CoinRow;
