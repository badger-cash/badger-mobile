import React, { useEffect, useCallback } from "react";
import { connect, ConnectedProps } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";
import { NavigationScreenProps } from "react-navigation";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";

import { addressToSlp, addressToCash } from "../utils/account-utils";
import { getType } from "../utils/schemeParser-utils";
import { FullState } from "../data/store";

import lang from "../_locales/index";
var tran = new lang("AuthLoadingScreen");

const Wrapper = styled(View)`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const InnerWrapper = styled(View)`
  justify-content: center;
  align-items: center;
  flex: 1;
`;

type PropsFromParent = NavigationScreenProps & {};

const mapStateToProps = (state: FullState) => {
  return {
    mnemonic: getMnemonicSelector(state)
  };
};

const mapDispatchToProps = {
  getAccount
};

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromParent & PropsFromRedux;

const AuthLoadingScreen = ({ navigation, mnemonic, getAccount }: Props) => {
  const handleDeepLink = useCallback(
    async params => {
      const { uri, r } = params;
      const formattedURI = uri && uri.startsWith(":") ? uri.slice(1) : uri;

      if (r) {
        navigation.navigate("Bip70Confirm", {
          paymentURL: r
        });
        return;
      }

      let amountFormatted = null;
      let addressFormatted = null;
      let tokenId = null;
      let parseError = null;

      const amounts = Object.entries(
        params
      ).filter(([key, val]: [string, any]) => key.startsWith("amount"));

      const amountsFormatted = amounts.map(curr => {
        const amountRaw = curr[1] as string;
        let currTokenId = null;
        let currAmount = null;

        if (amountRaw != null && amountRaw.includes("-")) {
          [currAmount, currTokenId] = amountRaw.split("-");
        } else {
          currAmount = amountRaw;
        }

        return {
          tokenId: currTokenId,
          paramAmount: currAmount
        };
      });

      if (amountsFormatted.length > 1) {
        parseError = tran.getStr("parseError1");
      } else if (amountsFormatted.length === 1) {
        const target = amountsFormatted[0];
        tokenId = target.tokenId;

        amountFormatted = target.paramAmount;
      }

      let type = null;

      try {
        type = getType(formattedURI);

        addressFormatted =
          type === "cashaddr"
            ? await addressToCash(formattedURI)
            : await addressToSlp(formattedURI);
      } catch (e) {
        parseError = tran.getStr("parseError2");
      }

      navigation.navigate("SendSetup", {
        tokenId,
        uriError: parseError,
        uriAddress:
          typeof addressFormatted === "string" ? addressFormatted : "",

        uriAmount: amountFormatted
      });
    },
    [navigation]
  );
  // re-generate accounts keypair then go to Main.
  useEffect(() => {
    const navParams = navigation.state.params;

    if (mnemonic) {
      getAccount(mnemonic);

      if (navParams) {
        handleDeepLink(navParams);
        return;
      }
      navigation.navigate("Main");
    } else {
      navigation.navigate("AuthStack");
    }
  }, [mnemonic, handleDeepLink, navigation, getAccount]);

  return (
    <Wrapper>
      <InnerWrapper>
        <ActivityIndicator />
        <Spacer />
        <T monospace>{tran.getStr("Herding_Badgers")}</T>
      </InnerWrapper>
    </Wrapper>
  );
};

export default connector(AuthLoadingScreen);
