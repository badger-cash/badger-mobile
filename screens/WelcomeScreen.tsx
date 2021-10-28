import React from "react";
import { SafeAreaView, View, Image } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import styled from "styled-components";

import { T, H1, H2, Spacer, Button } from "../atoms";

import BadgerIcon from "../assets/images/icon-full.png";
import lang from "../_locales/index";

let tran = new lang("WelcomeScreen");

const StyledWrapper = styled(SafeAreaView)`
  display: flex;
  flex: 1;
  align-items: center;
  margin: 0 16px;
`;

type Props = NavigationScreenProps & {};

const WelcomeScreen = ({ navigation }: Props) => {
  return (
    <StyledWrapper>
      <Spacer />
      <H1>{tran.getStr("name_wallet")}</H1>
      <Spacer />
      <Image
        source={BadgerIcon}
        style={{
          width: 150,
          height: 150
        }}
      />
      <Spacer />
      <View
        style={{
          flex: 1
        }}
      >
        <H2
          style={{
            textAlign: "center"
          }}
        >
          {tran.getStr("msg_welcome")}
        </H2>
        <Spacer small />
        <T center>{tran.getStr("des")} </T>
      </View>

      <View
        style={{
          flex: 1
        }}
      >
        <Button
          onPress={() => navigation.navigate("CreateWallet")}
          text={tran.getStr("btn_new_wallet")}
        />
        <Spacer small />
        <Button
          onPress={() => navigation.navigate("RestoreFromBackup")}
          text={tran.getStr("btn_restore_wallet")}
        />
      </View>
    </StyledWrapper>
  );
};

export default WelcomeScreen;
