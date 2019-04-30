// @flow

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect } from "react-redux";

import { SafeAreaView, View, TextInput } from "react-native";

import { H1, Button, T, Spacer } from "../atoms";
import { getAccount } from "../data/accounts/actions";
import { hasMnemonicSelector } from "../data/accounts/selectors";

const Screen = styled(View)`
  padding: 10px;
`;

const StyledTextInput = styled(TextInput)`
  border: 1px ${props => props.theme.primary500};
  padding: 15px 5px;
`;

const ErrorContainer = styled(View)`
  border-color: ${props => props.theme.danger500};
  border-width: 1px;
  padding: 5px;
`;

const formatMnemonic = (mnemonic: string) => {
  if (!mnemonic) return "";
  const splitWords = mnemonic.split(" ");

  // Remove all extra spaces whenever a new word begins
  const cleaned =
    splitWords.slice(-1)[0] !== "" ? splitWords.filter(Boolean) : splitWords;

  const formatted = cleaned.join(" ").toLowerCase();

  return formatted;
};

// Basic mnemonic validation, for now just ensure it's length is 12
const validateMnemonic = (mnemonic: string) => {
  const trimmed = mnemonic.trim();
  const split = trimmed.split(" ");
  const validLength = split.length === 12;
  return validLength;
};

type Props = {
  getAccount: Function,
  isCreated: boolean,
  navigation: { navigate: Function }
};

const RestoreWalletScreen = ({ navigation, getAccount, isCreated }: Props) => {
  const [mnemonic, setMnemonic] = useState("");
  const [inputError, setInputError] = useState(null);

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
        <Spacer large />
        <StyledTextInput
          multiline
          editable
          autoComplete="off"
          autoCorrect={false}
          placeholder="Enter Backup Phrase / Mnemonic"
          value={mnemonic}
          onChangeText={text => {
            const sanitized = formatMnemonic(text);
            setMnemonic(sanitized);
            setInputError(null);
          }}
        />
        <Spacer large />

        {inputError ? (
          <>
            <ErrorContainer>
              <T size="small" type="danger" center>
                {inputError}
              </T>
            </ErrorContainer>
            <Spacer />
          </>
        ) : (
          <Spacer />
        )}

        <Button
          onPress={() => {
            const validMnemonic = validateMnemonic(mnemonic);
            if (!validMnemonic) {
              setInputError(
                "That mnemonic doesn't look right, double check that pass phrase and make sure it's 12 words long and try again"
              );
              return;
            }
            getAccount(mnemonic.trim());
          }}
          text="Restore Wallet"
        />
        <Spacer />
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
