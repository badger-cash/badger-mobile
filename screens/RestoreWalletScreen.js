// @flow

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect } from "react-redux";

import { SafeAreaView, View, TextInput, TouchableOpacity } from "react-native";

import { H1, H2, Button, T, Spacer } from "../atoms";
import { getAccount } from "../data/accounts/actions";
import { hasMnemonicSelector } from "../data/accounts/selectors";

const Screen = styled(View)`
  padding: 10px;
`;

const StyledTextInput = styled(TextInput)`
  border: 1px ${props => props.theme.primary500};
  padding: 15px 5px;
`;

type Props = {
  getAccount: Function,
  isCreated: boolean,
  navigation: { navigate: Function }
};

const RestoreWalletScreen = ({ navigation, getAccount, isCreated }: Props) => {
  const [mnemonic, setMnemonic] = useState("");

  useEffect(() => {
    if (isCreated) {
      navigation.navigate("Home");
    }
  }, [isCreated]);

  return (
    <SafeAreaView>
      <Screen>
        <Spacer />
        <H1 center>Restore From Recovery Phrase</H1>
        <Spacer />
        <T center>
          Enter your 12 word recovery phrase or mnemonic to login to an existing
          account
        </T>
        <Spacer />
        <StyledTextInput
          multiline
          editable
          autoComplete="off"
          autoCorrect={false}
          placeholder="Enter Backup Phrase / Mnemonic"
          value={mnemonic}
          onChangeText={text => {
            setMnemonic(text);
          }}
        />
        <Spacer />
        <TouchableOpacity
          onPress={() => {
            getAccount(mnemonic.trim());
          }}
        >
          <T>Restore</T>
        </TouchableOpacity>
      </Screen>
    </SafeAreaView>
  );
};

const mapStateToProps = state => ({ isCreated: hasMnemonicSelector(state) });
const mapDispatchToProps = {
  getAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(RestoreWalletScreen);
