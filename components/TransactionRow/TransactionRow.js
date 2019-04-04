// @flow

import React from "react";
import styled, { css } from "styled-components";
import { View, Image } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import moment from "moment";

import { T } from "../../atoms";

const Row = styled(View)`
  padding: 10px 10px 12px;
  border-bottom-color: ${props => props.theme.fg700};
  border-bottom-width: 1px;
  ${props =>
    props.type === "send"
      ? css`
          background-color: ${props => props.theme.danger700};
        `
      : css`
          background-color: ${props => props.theme.success700};
        `}
`;

const TopRow = styled(View)`
  margin-bottom: 5px;
`;
const BottomRow = styled(View)`
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

const InfoArea = styled(View)`
  flex: 1;
`;
const AmountArea = styled(View)``;

type Props = {
  type: "send" | "receive",
  timestamp: number,
  toAddress: string,
  fromAddress: string,
  symbol: string,
  tokenId: string,
  amount: number
};

const TransactionRow = ({
  type,
  timestamp,
  toAddress,
  fromAddress,
  symbol,
  tokenId,
  amount
}: Props) => {
  const transactionAddress = type === "send" ? toAddress : fromAddress;

  const imageSource = { uri: makeBlockie(transactionAddress) };
  return (
    <Row type={type}>
      <TopRow>
        <T size="small" nature="muted">
          {moment(timestamp).format("MMMM Do YYYY, h:mm:ss a")}
        </T>
      </TopRow>
      <BottomRow>
        <IconArea>
          <IconImage source={imageSource} />
        </IconArea>
        <InfoArea>
          <T>{type}</T>
          {/* <T size="large">{amount}</T> */}
          {/* <T size="small">{extra}</T> */}
        </InfoArea>
        <AmountArea>
          <T>
            {type === "send" ? "-" : "+"}
            {amount}
          </T>
        </AmountArea>
      </BottomRow>
    </Row>
  );
};

export default TransactionRow;
