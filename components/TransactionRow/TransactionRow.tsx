import React from "react";
import styled from "styled-components";
import { View, Image, Linking, TouchableOpacity } from "react-native";
import makeBlockie from "ethereum-blockies-base64";
import moment from "moment";
import BigNumber from "bignumber.js";

import Feather from "react-native-vector-icons/Feather";

import { T } from "../../atoms";
import { SLP } from "../../utils/slp-sdk-utils";

export type TransactionRowTypes =
  | "send"
  | "receive"
  | "interwallet"
  | "payout"
  | "unrecognized";

interface RowProps {
  type?: TransactionRowTypes;
}

const Row = styled(View)<RowProps>`
  padding: 16px;
  margin-bottom: 8px;

  background-color: ${props =>
    props.type
      ? {
          send: props.theme.accent900,
          receive: props.theme.primary900,
          interwallet: props.theme.fg800,
          payout: props.theme.payout900,
          unrecognized: props.theme.fg800
        }[props.type]
      : props.theme.fg800};
`;

const DateRow = styled(View)`
  margin-bottom: 4px;
  flex-direction: row;
  justify-content: space-between;
`;
const MetaRow = styled(View)`
  margin-top: 4px;
`;
const AmountRow = styled(View)`
  flex-direction: row;
`;

const IconArea = styled(View)`
  justify-content: center;
  margin-right: 10px;
`;

const EmptyIcon = styled(View)`
  width: 36;
  height: 36;
  border-radius: 18;
  overflow: hidden;
  background-color: ${props => props.theme.fg700};
  border: 2px solid ${props => props.theme.primary500};
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

interface BlockieCache {
  [address: string]: any;
}

let blockieCache: BlockieCache = {};

interface Props {
  type: TransactionRowTypes;
  txId: string;
  confirmations?: number | null;
  timestamp: number;
  toAddress: string | null;
  toAddresses: string[];
  fromAddresses: string[];
  fromAddress?: string | null;
  symbol: string;
  tokenId?: string;
  amount: string;
}

const TransactionRow = ({
  confirmations,
  type,
  txId,
  timestamp,
  toAddresses,
  toAddress,
  fromAddresses,
  fromAddress,
  symbol,
  tokenId,
  amount
}: Props) => {
  // TODO - Special image for interwallet, payout, and receive from many
  const transactionAddress = {
    send: toAddress,
    interwallet: null,
    payout: fromAddress || fromAddresses[0],
    receive: fromAddress || fromAddresses[0],
    unrecognized: null
  }[type];

  let formattedTransactionAddress = null;
  const amountAsBig = new BigNumber(amount);

  try {
    // Above method returns an error instead of throwing one for now.
    formattedTransactionAddress = tokenId
      ? SLP.Address.toSLPAddress(transactionAddress)
      : transactionAddress;

    if (typeof formattedTransactionAddress !== "string") {
      formattedTransactionAddress = null;
    }
  } catch (e) {
    formattedTransactionAddress = null;
  }

  let blockie = null;
  if (transactionAddress) {
    blockie = blockieCache[transactionAddress];

    if (!blockie) {
      const newBlockie = makeBlockie(transactionAddress || "unknown");
      blockieCache = {
        ...blockieCache,
        [transactionAddress]: newBlockie
      };
      blockie = newBlockie;
    }
  }

  const imageSource = {
    uri: blockie
  };
  const typeFormatted = {
    send: "Sent",
    interwallet: "Sent to self",
    receive: "Received",
    payout: "Payout",
    unrecognized: "Unknown Type"
  }[type];

  return (
    <Row type={type}>
      <DateRow>
        <View>
          <T size="small" type="muted">
            {moment(timestamp).format("MM-DD-YYYY, h:mm a")}
          </T>
          <T size="xsmall" type="muted" monospace>
            {confirmations !== null ? confirmations : "--"}-conf
          </T>
        </View>
        <TouchableOpacity
          onPress={() =>
            Linking.openURL(`https://explorer.bitcoin.com/bch/tx/${txId}`)
          }
        >
          <T size="small" type="muted2">
            Explorer <Feather name="external-link" />
          </T>
        </TouchableOpacity>
      </DateRow>
      <AmountRow>
        <IconArea>
          {blockie ? <IconImage source={imageSource} /> : <EmptyIcon />}
        </IconArea>
        <InfoArea>
          <T>{typeFormatted}</T>
        </InfoArea>
        <AmountArea>
          <T>
            {type === "interwallet"
              ? amountAsBig.eq(0)
                ? ` `
                : `${amount}`
              : type === "send"
              ? `- ${amount}`
              : `+ ${amount}`}
          </T>
        </AmountArea>
      </AmountRow>
      <MetaRow>
        {transactionAddress && <T size="tiny">{formattedTransactionAddress}</T>}
        <T size="tiny" type="muted">
          {txId}
        </T>
      </MetaRow>
    </Row>
  );
};

export default TransactionRow;
