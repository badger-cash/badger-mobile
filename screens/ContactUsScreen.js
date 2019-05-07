// @flow

import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Linking,
  TouchableOpacity
} from "react-native";
import styled from "styled-components";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { T, Spacer } from "../atoms";

const ScreenWrapper = styled(ScrollView)`
  padding: 7px;
`;

type Props = {};
const ContactUsScreen = (props: Props) => {
  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper contentContainerStyle={{ flexGrow: 1 }}>
        <Spacer />
        <T center>We hope you are enjoying Badger Mobile</T>
        <Spacer small />
        <T center>
          If you wish to give feedback, ask a question, or contact us for
          another reason, get in touch with the team through electronic mail or
          Telegram
        </T>
        <Spacer large />
        <T center>
          <Ionicons name="ios-mail" size={22} /> Email
        </T>
        <Spacer tiny />
        <TouchableOpacity
          onPress={() =>
            Linking.openURL("mailto:badger@bitcoin.com?subject=Badger Mobile")
          }
        >
          <T center size="large">
            badger@bitcoin.com
          </T>
        </TouchableOpacity>
        <Spacer />
        <T center>
          <FontAwesome name="telegram" size={22} /> Telegram
        </T>
        <Spacer tiny />
        <TouchableOpacity
          onPress={() =>
            Linking.openURL("https://t.me/joinchat/IoTQ_hGflnfwd3YJSF8cRQ")
          }
        >
          <T center size="large">
            Badger Wallet Group
          </T>
        </TouchableOpacity>
        <Spacer />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default ContactUsScreen;
