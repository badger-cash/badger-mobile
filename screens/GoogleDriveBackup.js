// @flow

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Linking,
  TouchableOpacity,
  Text,
  View,
  TouchableHighlight,
  PermissionsAndroid
} from "react-native";

import RNFS from "react-native-fs";
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes
} from "react-native-google-signin";
// import GDrive from "react-native-google-drive-api-wrapper";

import styled from "styled-components";

import { T, Spacer } from "../atoms";

const ScreenWrapper = styled(ScrollView)`
  padding: 7px 16px;
`;

GoogleSignin.configure();

const signIn = async setUserInfo => {
  let asdf;
  try {
    asdf = await GoogleSignin.signIn();
  } catch (error) {
    console.log("error", error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // user cancelled the login flow
    } else if (error.code === statusCodes.IN_PROGRESS) {
      // operation (f.e. sign in) is in progress already
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      // play services not available or outdated
    } else {
      // some other error happened
    }
  }
  return asdf;
};

type Props = {};
const GoogleDriveBackup = (props: Props) => {
  // useEffect(async () => {
  //   // signIn();
  // }, []);

  const [userInfo, setUserInfo] = useState("");

  console.log("state", userInfo);

  return (
    <SafeAreaView style={{ height: "100%" }}>
      <ScreenWrapper contentContainerStyle={{ flexGrow: 1 }}>
        <Spacer />
        <T center>dev</T>
        <Spacer small />
        <T center>dev asdf page</T>
        <GoogleSigninButton
          style={{ width: 192, height: 48 }}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Light}
          onPress={async () => {
            let result = await signIn();
            console.log("result", result);

            setUserInfo(result);
          }}
          disabled={false}
        />
        {userInfo !== "" && <T> Test signed in: {userInfo.user.email} </T>}
        <Spacer large />
      </ScreenWrapper>
    </SafeAreaView>
  );
};

export default GoogleDriveBackup;
