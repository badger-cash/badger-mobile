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
  justify-content: center;
`;
const AmountArea = styled(View)`
  justify-content: center;
`;

let blockieCache = {};

type Props = {
  type: "send" | "receive",
  timestamp: number,
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
  fromAddresses,
  fromAddress,
  symbol,
  tokenId,
  amount
}: Props) => {
  const transactionAddress =
    type === "send" ? toAddresses[0] : fromAddress || fromAddresses[0];

  let blockie = blockieCache[transactionAddress];
  if (!blockie) {
    const newBlockie = makeBlockie(transactionAddress);
    blockieCache = { ...blockieCache, [transactionAddress]: newBlockie };
    blockie = newBlockie;
  }
  const imageSource = { uri: blockie };
  // const imageSource = { uri: makeBlockie(transactionAddress) }; // no cache version

  const typeFormatted = type === "send" ? "Sent" : "Received";
  return (
    <Row type={type}>
      <TopRow>
        <T size="small" type="muted">
          {moment(timestamp).format("MMMM Do YYYY, h:mm:ss a")}
        </T>
        <T size="tiny">{transactionAddress}</T>
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
