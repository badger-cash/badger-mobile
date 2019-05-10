// @flow

import React from "react";
import styled, { css } from "styled-components";
import { View, Image, StyleSheet } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import moment from "moment";

import SLPSDK from "slp-sdk";

import { T } from "../../atoms";

const SLP = new SLPSDK();

const Row = styled(View)`
  padding: 16px;
  border-bottom-color: ${props => props.theme.fg700};
  border-bottom-width: ${StyleSheet.hairlineWidth};
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
  justify-content: center;
`;
const AmountArea = styled(View)`
  justify-content: center;
`;

let blockieCache = {};

type Props = {
  type: "send" | "receive",
  timestamp: number,
  toAddress: string,
  toAddresses: string[],
  fromAddresses: string[],
  fromAddress: ?string,
  symbol: string,
  tokenId: string,
  amount: string
};

const TransactionRow = ({
  type,
  timestamp,
  toAddresses,
  toAddress,
  fromAddresses,
  fromAddress,
  symbol,
  tokenId,
  amount
}: Props) => {
  // Can remove `|| toAddresses[0]` before launch.
  const transactionAddress =
    type === "send" ? toAddress : fromAddress || fromAddresses[0];

  let blockie = blockieCache[transactionAddress];
  if (!blockie) {
    const newBlockie = makeBlockie(transactionAddress || "unknown");
    blockieCache = { ...blockieCache, [transactionAddress]: newBlockie };
    blockie = newBlockie;
  }
  const imageSource = { uri: blockie };

  const typeFormatted = type === "send" ? "Sent" : "Received";
  return (
    <Row type={type}>
      <TopRow>
        <T size="small" type="muted">
          {moment(timestamp).format("MMMM Do YYYY, h:mm:ss a")}
        </T>
        {transactionAddress && (
          <T size="tiny">
            {tokenId
              ? SLP.Address.toSLPAddress(transactionAddress)
              : transactionAddress}
          </T>
        )}
      </TopRow>
      <BottomRow>
        <IconArea>
          <IconImage source={imageSource} />
        </IconArea>
        <InfoArea>
          <T>{typeFormatted}</T>
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
