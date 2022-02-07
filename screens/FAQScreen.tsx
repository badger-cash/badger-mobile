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
let tran = new lang("FAQScreen");

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
          <T>{tran.getStr("Frist_FAQ").body.toString()}</T>
          <TouchableOpacity
            onPress={() => Linking.openURL("http://www.badger.cash")}
          >
            <T type="accent">badger.cash</T>
          </TouchableOpacity>
        </FAQItem>
        <FAQItem title={tran.getStr("Second_FAQ").title}>
          <T>{tran.getStr("Second_FAQ").body.toString()}</T>
        </FAQItem>
        <FAQItem title={tran.getStr("Third_FAQ").title}>
          <T>{tran.getStr("Third_FAQ").body.toString()}</T>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://bitcoincash.org")}
          >
            <T type="accent">bitcoincash.org</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title={tran.getStr("Fourth_FAQ").title}>
          <T>{tran.getStr("Fourth_FAQ").body.toString()}</T>
          <Spacer small />
          <T>{tran.getStr("Fourth_FAQ").Second_body.toString()}</T>

          <TouchableOpacity
            onPress={() => Linking.openURL("https://simpleledger.cash")}
          >
            <T type="accent">simpleledger.cash</T>
          </TouchableOpacity>
        </FAQItem>

        <FAQItem title={tran.getStr("Fifth_FAQ").title}>
          <T>{tran.getStr("Fifth_FAQ").body.toString()}</T>
          <Spacer small />
          <T>{tran.getStr("Fifth_FAQ").Second_body.toString()}</T>
        </FAQItem>

        <FAQItem title={tran.getStr("Sixth_FAQ").title}>
          <T>{tran.getStr("Sixth_FAQ").body.toString()}</T>
          <Spacer small />
          <T> {tran.getStr("Sixth_FAQ").Second_body.toString()} </T>
        </FAQItem>

        <FAQItem title={tran.getStr("Seventh_FAQ").title}>
          <T>{tran.getStr("Seventh_FAQ").body.toString()}</T>
          <Spacer small />
          <T>{tran.getStr("Seventh_FAQ").Second_body.toString()}</T>
        </FAQItem>

        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default FAQScreen;
