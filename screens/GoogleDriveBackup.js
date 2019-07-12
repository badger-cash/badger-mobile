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
const requestWriteStoragePermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: "Write your android storage Permission",
        message: "Write your android storage to save your data"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can write storage");
    } else {
      console.log("Write Storage permission denied");
    }
  } catch (err) {
    console.log("cannot write", err);
  }
};

const requestReadStoragePermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      {
        title: "Read your android storage Permission",
        message: "Read your android storage to save your data"
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can Read storage");
    } else {
      console.log("Read Storage permission denied");
    }
  } catch (err) {
    console.log("cannot read", err);
  }
};

async function checkPermissions() {
  const canWrite = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
  );
  if (!canWrite) {
    requestWriteStoragePermission();
  }

  const canRead = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  );

  if (!canRead) {
    requestReadStoragePermission();
  }
}

type Props = {};
const GoogleDriveBackup = (props: Props) => {
  useEffect(() => {
    checkPermissions();
  }, []);

  const [userInfo, setUserInfo] = useState("");
  const [accessToken, setAccessToken] = useState("");

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
            const { accessToken } = await GoogleSignin.getTokens();
            setAccessToken(accessToken);
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
