import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { connect, ConnectedProps } from "react-redux";

import {
  SafeAreaView,
  View,
  ScrollView,
  TextInput,
  StyleSheet
} from "react-native";

import { H1, Button, T, Spacer } from "../atoms";
import { getAccount } from "../data/accounts/actions";
import { hasMnemonicSelector } from "../data/accounts/selectors";

import { SLP } from "../utils/slp-sdk-utils";
import { FullState } from "../data/store";

const Screen = styled(ScrollView)`
  padding: 0 16px;
  height: 100%;
`;

const StyledTextInput = styled(TextInput)`
  border: 1px ${props => props.theme.primary500};
  padding: 15px 5px;
`;

const ErrorContainer = styled(View)`
  border-color: ${props => props.theme.danger500};
  border-width: ${StyleSheet.hairlineWidth};
  border-radius: 4px;
  padding: 8px;
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

type PropsFromParent = {
  navigation: {
    navigate: Function;
    goBack: Function;
  };
};

const mapStateToProps = (state: FullState) => ({
  isCreated: hasMnemonicSelector(state)
});

const mapDispatchToProps = {
  getAccount
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const RestoreWalletScreen = ({ navigation, getAccount, isCreated }: Props) => {
  const [mnemonic, setMnemonic] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (isCreated) {
      navigation.navigate("Home");
    }
  }, [isCreated]);

  return (
    <SafeAreaView>
      <Screen
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1
        }}
      >
        <Spacer />
        <H1 center>Restore Wallet</H1>
        <Spacer />
        <T center>
          Enter your 12 word seed phrase or mnemonic to restore and access an
          existing wallet
        </T>
        <Spacer large />
        <StyledTextInput
          multiline
          editable
          autoCompleteType="off"
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

        {inputError && (
          <ErrorContainer>
            <T size="small" type="danger" center>
              {inputError}
            </T>
          </ErrorContainer>
        )}
        <Spacer fill />
        <Button
          onPress={() => navigation.goBack()}
          text="Cancel"
          nature="cautionGhost"
        />
        <Spacer small />

        <Button
          onPress={() => {
            let errorMessage = "Double check the recovery phrase and try again";

            const mnemonicMessage = SLP.Mnemonic.validate(
              mnemonic,
              SLP.Mnemonic.wordLists().english
            );

            if (mnemonicMessage === "Valid mnemonic") {
              getAccount(mnemonic.trim());
              return;
            }

            if (mnemonicMessage === "Invalid mnemonic") {
              errorMessage = `${mnemonicMessage}, check the recovery phrase and try again`;
            } else {
              errorMessage = mnemonicMessage;
            }

            if (!mnemonic.length) {
              errorMessage = "Seed Phrase / Mnemonic cannot be empty";
            }

            setInputError(errorMessage);
          }}
          text="Restore Wallet"
        />
        <Spacer />
      </Screen>
    </SafeAreaView>
  );
};

export default connector(RestoreWalletScreen);
