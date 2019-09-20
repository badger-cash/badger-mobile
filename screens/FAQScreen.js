// @flow

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
  title: string,
  children: React.Node
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
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper contentContainerStyle={{ flexGrow: 1 }}>
        <FAQItem title="What is Badger wallet?">
          <T>
            Badger Wallet is a Bitcoin Cash (BCH) and Simple Token (SLP) wallet,
            made to prioritize simplicity for everyday use.
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://badger.bitcoin.com")}
          >
            <T type="accent">badger.bitcoin.com</T>
          </TouchableOpacity>
        </FAQItem>
        <FAQItem title="What is Bitcoin Cash (BCH)?">
          <T>
            Bitcoin Cash (BCH) is a version of bitcoin which focuses on being
            peer to peer electronic cash for everyone. Learn more at
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://bitcoincash.org")}
          >
            <T type="accent">bitcoincash.org</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="What are Simple Tokens (SLP)?">
          <T>
            Simple tokens are tokens following the Simple Ledger Protocol
            specification which is built upon the Bitcoin Cash network. With
            simple tokens you can tokenize anything and everything easily.
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://simpleledger.cash")}
          >
            <T type="accent">simpleledger.cash</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="Why can't I send SLP tokens?">
          <T>
            To send SLP tokens, a small amount of BCH is used to pay for the
            transaction fee. Make sure you have some BCH in your wallet before
            sending SLP tokens. If this isn't the case, and the problem persists
            then please get in contact with the team from the Contact Us page.
          </T>
        </FAQItem>
        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default FAQScreen;
