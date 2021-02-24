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

import lang from "../_locales/index";
var tran = new lang("FAQScreen");

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
        <FAQItem title={tran.getStr("Frist_FAQ").title}>
          <T>{tran.getStr("Frist_FAQ").body.join("\n")}</T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://badger.bitcoin.com")}
          >
            <T type="accent">badger.bitcoin.com</T>
          </TouchableOpacity>
        </FAQItem>
        <FAQItem title={tran.getStr("Second_FAQ").title}>
          <T>{tran.getStr("Second_FAQ").body.join("\n")}</T>
        </FAQItem>
        <FAQItem title={tran.getStr("Third_FAQ").title}>
          <T>{tran.getStr("Third_FAQ").body.join("\n")}</T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://bitcoincash.org")}
          >
            <T type="accent">bitcoincash.org</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title={tran.getStr("Fourth_FAQ").title}>
          <T>{tran.getStr("Fourth_FAQ").body.join("\n")}</T>
          <Spacer small />
          <T>{tran.getStr("Fourth_FAQ").body_toice.join("\n")}</T>

          <TouchableOpacity
            onPress={() => Linking.openURL("https://simpleledger.cash")}
          >
            <T type="accent">simpleledger.cash</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title={tran.getStr("Fifth_FAQ").title}>
          <T>{tran.getStr("Fifth_FAQ").body.join("\n")}</T>
          <Spacer small />
          <T>{tran.getStr("Fifth_FAQ").body_toice.join("\n")}</T>
        </FAQItem>

        <FAQItem title={tran.getStr("Sixth_FAQ").title}>
          <T>{tran.getStr("Sixth_FAQ").body.join("\n")}</T>
          <Spacer small />
          <T>{tran.getStr("Sixth_FAQ").body_toice.join("\n")}</T>
        </FAQItem>

        <FAQItem title={tran.getStr("Seventh_FAQ").title}>
          <T>{tran.getStr("Sixth_FAQ").body.join("\n")}</T>
          <Spacer small />
          <T>{tran.getStr("Sixth_FAQ").body_toice.join("\n")}</T>
        </FAQItem>

        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default FAQScreen;
