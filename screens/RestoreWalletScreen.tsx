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
import { NavigationScreenProps } from "react-navigation";

import { H1, Button, T, Spacer } from "../atoms";
import { getAccount } from "../data/accounts/actions";
import { hasMnemonicSelector } from "../data/accounts/selectors";

import bcoin from "bcash";
import { FullState } from "../data/store";

import lang from "../_locales/index";
let tran = new lang("RestoreWalletScreen");

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

type PropsFromParent = NavigationScreenProps & {};

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
      navigation.navigate("Main");
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
        <H1 center>{tran.getStr("Restore_Wallet")}</H1>
        <Spacer />
        <T center>{tran.getStr("Msg_Enter_your_12_word")}</T>
        <Spacer large />
        <StyledTextInput
          multiline
          editable
          autoCompleteType="off"
          autoCorrect={false}
          placeholder={tran.getStr("Msg_Enter_Backup_Phrase")}
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
          text={tran.getStr("btn_Cancel")}
          nature="cautionGhost"
        />
        <Spacer small />

        <Button
          onPress={() => {
            let errorMessage = tran.getStr("erorrMsg_Double_check");

            let mnemonicMessage = tran.getStr("mnemonicMessage");

            try {
              new bcoin.Mnemonic(mnemonic);
              mnemonicMessage = tran.getStr("mnemonicMessage");
            } catch (e) {
              console.error(e);
            }

            if (mnemonicMessage === "Valid mnemonic") {
              getAccount(mnemonic.trim());
              return;
            }

            if (mnemonicMessage === "Invalid mnemonic") {
              errorMessage = `${mnemonicMessage}, ${tran.getStr(
                "Msg_check_the_recovery"
              )}`;
            } else {
              errorMessage = mnemonicMessage;
            }

            if (!mnemonic.length) {
              errorMessage = tran.getStr("erorrMsg_Seed_Phrase");
            }

            setInputError(errorMessage);
          }}
          text={tran.getStr("btn_Restore")}
        />
        <Spacer />
      </Screen>
    </SafeAreaView>
  );
};

export default connector(RestoreWalletScreen);
