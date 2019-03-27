// @flow

import React from "react";
import styled from "styled-components";

import { View } from "react-native";

import { T } from "../../atoms";

type Props = {
  ticker: string,
  name: string,
  amount: string,
  extra: string
};

const Outter = styled(View)`
  padding: 10px;
`;

const IconArea = styled(View)``;

const InfoArea = styled(View)``;

const CoinRow = ({ ticker, name, amount, extra }) => {
  return (
    <Outter>
      <IconArea />
      <InfoArea>
        <T>
          {ticker} - {name}
        </T>
        <T>{amount}</T>
        {/* <T>{extra}</T> */}
      </InfoArea>
    </Outter>
  );
};

export default CoinRow;
