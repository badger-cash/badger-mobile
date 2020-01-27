import * as React from "react";
import {
  SafeAreaView,
  ScrollView,
  Linking,
  TouchableOpacity
} from "react-native";
import styled from "styled-components";

import { T, Spacer } from "../atoms";

const ScreenWrapper = styled(ScrollView)`
  padding: 7px 16px;
`;

type FAQProps = {
  title: string;
  children: React.Node;
};

const FAQItem = ({ title, children }: FAQProps) => (
  <>
    <Spacer />
    <T weight="bold">{title}</T>
    <Spacer tiny />
    {children}
  </>
);

type Props = {};

const FAQScreen = (props: Props) => {
  return (
    <SafeAreaView
      style={{
        height: "100%"
      }}
    >
      <ScreenWrapper
        contentContainerStyle={{
          flexGrow: 1
        }}
      >
        <FAQItem title="What is Badger Wallet?">
          <T>
            Badger Wallet is a Bitcoin Cash (BCH) and Simple Token (SLP) wallet,
            designed to prioritize simplicity for everyday use.
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://badger.bitcoin.com")}
          >
            <T type="accent">badger.bitcoin.com</T>
          </TouchableOpacity>
        </FAQItem>
        <FAQItem title="Which currencies does Badger wallet support?">
          <T>Bitcoin Cash (BCH) and Simple Ledger Protocol (SLP) tokens</T>
        </FAQItem>
        <FAQItem title="What is Bitcoin Cash (BCH)?">
          <T>
            Bitcoin Cash (BCH) is a version of bitcoin which focuses on being
            peer to peer electronic cash for the world. Learn more at
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://bitcoincash.org")}
          >
            <T type="accent">bitcoincash.org</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="What are Simple Ledger Protocol (SLP) tokens?">
          <T>
            SLP tokens are tokens which follow the Simple Ledger Protocol
            specification which is built upon the Bitcoin Cash network. SLP
            tokens allow anyone to create, send, and receive tokens with anyone,
            easily.
          </T>

          <TouchableOpacity
            onPress={() => Linking.openURL("https://simpleledger.cash")}
          >
            <T type="accent">simpleledger.cash</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="Why can't I send tokens?">
          <T>
            Receiving tokens is free, but sending requires a little bit of
            Bitcoin Cash (BCH) to pay the transaction fee. Make sure your wallet
            has a little bit of BCH before sending SLP tokens.
          </T>
        </FAQItem>

        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default FAQScreen;
