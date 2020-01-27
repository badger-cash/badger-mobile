import React, { useEffect, useCallback } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";

import { addressToSlp, addressToCash } from "../utils/account-utils";
import { getType } from "../utils/schemeParser-utils";

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

type Props = {
  navigation: {
    navigate: Function;
    state: {
      params: any;
    };
  };
  mnemonic: string;
  getAccount: Function;
};

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

      const amounts = Object.entries(params).filter(([key, val]) =>
        key.startsWith("amount")
      );

      const amountsFormatted = amounts.map(curr => {
        const amountRaw = curr[1];
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
        parseError =
          "Badger Wallet currently only supports sending one coin at a time.  The URI is requesting multiple coins.";
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
        parseError = `Invalid address detected`;
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
        <T monospace>Herding Badgers</T>
      </InnerWrapper>
    </Wrapper>
  );
};

const mapStateToProps = state => {
  return {
    mnemonic: getMnemonicSelector(state)
  };
};

const mapDispatchToProps = {
  getAccount
};
export default connect(mapStateToProps, mapDispatchToProps)(AuthLoadingScreen);
