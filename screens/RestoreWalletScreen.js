// @flow

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect } from "react-redux";

import { SafeAreaView, View, TextInput, TouchableOpacity } from "react-native";

import { T, Spacer } from "../atoms";
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
  const [mnemonic, setMnemonic] = useState(
    "Enter Backup Phrase / Mnemonic Here"
  );

  useEffect(() => {
    if (isCreated) {
      navigation.navigate("Home");
    }
  }, [isCreated]);

  return (
    <SafeAreaView>
      <Screen>
        <T>Restore From Backup Phrase</T>
        <Spacer />
        <StyledTextInput
          multiline
          editable
          autoComplete="off"
          autoCorrect={false}
          autoFocus
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
