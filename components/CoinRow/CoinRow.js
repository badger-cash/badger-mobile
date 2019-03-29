// @flow

import React from "react";
import styled from "styled-components";

import { View, Image } from "react-native";
import makeBlockie from "ethereum-blockies-base64";

import { T } from "../../atoms";

import BitcoinCashImage from "../../assets/images/icon.png";

type Props = {
  ticker: string,
  name: string,
  amount: string,
  extra: string,
  tokenId: ?string
};

const Outter = styled(View)`
  padding: 10px;
  flex-direction: row;
`;

const IconArea = styled(View)`
  justify-content: center;
  margin-right: 10px;
`;
const IconImage = styled(Image)`
  width: 36;
  height: 36;
  border-radius: 18;
  overflow: hidden;
`;

const InfoArea = styled(View)``;

const CoinRow = ({ ticker, name, amount, extra, tokenId }: Props) => {
  console.log("coin row");
  console.log(tokenId);
  const imageSource =
    ticker === "BCH" ? BitcoinCashImage : { uri: makeBlockie(tokenId) };
  console.log("never");
  return (
    <Outter>
      <IconArea>
        <IconImage source={imageSource} />
      </IconArea>
      <InfoArea>
        <T>
          {ticker} - {name}
        </T>
        <T size="large">{amount}</T>
        {/* <T size="small">{extra}</T> */}
      </InfoArea>
    </Outter>
  );
};

const HeaderWrapper = styled(View)`
  padding: 10px;
`;

const CoinRowHeader = ({ children }) => {
  return (
    <HeaderWrapper>
      <T size="small" nature="muted">
        {children}
      </T>
    </HeaderWrapper>
  );
};

export { CoinRowHeader };
export default CoinRow;
