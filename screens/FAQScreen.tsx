import * as React from "react";
import {
  SafeAreaView,
  ScrollView,
  Linking,
  TouchableOpacity
} from "react-native";
import { NavigationScreenProps } from "react-navigation";
import styled from "styled-components";

import { T, Spacer } from "../atoms";

const ScreenWrapper = styled(ScrollView)`
  padding: 7px 16px;
`;

type FAQProps = {
  title: string;
  children: React.ReactNode;
};

const FAQItem = ({ title, children }: FAQProps) => (
  <>
    <Spacer />
    <T weight="bold">{title}</T>
    <Spacer tiny />
    {children}
  </>
);

type Props = NavigationScreenProps & {};

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
            Badger Wallet is a Bitcoin Cash (BCH) and SLP token wallet, designed
            to prioritize simplicity for everyday use.
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://badger.bitcoin.com")}
          >
            <T type="accent">badger.bitcoin.com</T>
          </TouchableOpacity>
        </FAQItem>
        <FAQItem title="Which cryptocurrencies does Badger wallet support?">
          <T>Bitcoin Cash (BCH) and thousands of SLP tokens.</T>
        </FAQItem>
        <FAQItem title="What is Bitcoin Cash (BCH)?">
          <T>
            Bitcoin Cash (BCH) is a peer-to-peer electronic cash system for the
            world. BCH enables permissionless spending for micro transactions,
            everyday spending, large business deals, and everything in between.
          </T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://bitcoincash.org")}
          >
            <T type="accent">bitcoincash.org</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="What are Simple Ledger Protocol (SLP) tokens?">
          <T>
            SLP is a token system built upon the Bitcoin Cash network. SLP
            tokens allow anyone - or business - to create, send, and receive
            their own tokens for whatever they want.
          </T>
          <Spacer small />
          <T>
            SLP tokens enable hundreds of new use-cases on the BCH network. From
            voting systems, reward / loyalty points, ticketing systems, event
            payouts, and many many more.
          </T>

          <TouchableOpacity
            onPress={() => Linking.openURL("https://simpleledger.cash")}
          >
            <T type="accent">simpleledger.cash</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title="Why can't I send tokens?">
          <T>
            Receiving tokens is free, but sending tokens requires a bit of
            Bitcoin Cash (BCH) to pay the transaction fee - typically
            ~0.00000400 BCH.
          </T>
          <Spacer small />
          <T>
            Be sure to add a little bit of BCH to your wallet and try again.
          </T>
        </FAQItem>

        <FAQItem title="How private is Badger?">
          <T>
            Badger uses a single address for all transactions. This means
            transactions to and from Badger can be linked together with analysis
            relatively easily.
          </T>
          <Spacer small />
          <T>We will make updates focused on privacy in the future.</T>
        </FAQItem>

        <FAQItem title="Should I store a lot of money in Badger?">
          <T>No.</T>
          <Spacer small />
          <T>
            Treat Badger similar to your regular wallet. Keep some BCH and
            tokens in it for spending, but store the rest of your crypto in a
            secure hardware wallet.
          </T>
        </FAQItem>

        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default FAQScreen;
