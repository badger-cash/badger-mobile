// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";
import { tokensByIdSelector } from "../data/tokens/selectors";
import { type TokenData } from "../data/tokens/reducer";

import { addressToSlp, addressToCash } from "../utils/account-utils";

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
  navigation: { navigate: Function, state: { params: any } },
  mnemonic: string,
  tokensById: { [tokenId: string]: TokenData },
  getAccount: Function
};

const AuthLoadingScreen = ({
  navigation,
  mnemonic,
  getAccount,
  tokensById
}: Props) => {
  const handleDeepLink = async params => {
    const { address } = params;

    let amountFormatted = null;
    let addressFormatted = null;
    let tokenId = null;
    let parseError = null;

    const amounts = Object.entries(params).filter(
      ([key: string, val: string]) => key.startsWith("amount")
    );

    const amountsFormatted = amounts.map(curr => {
      const amountRaw = curr[1];
      let currTokenId = null;
      let currAmount = null;

      if (amountRaw.includes("-")) {
        [currAmount, currTokenId] = amountRaw.split("-");
      } else {
        currAmount = amountRaw;
      }
      return { tokenId: currTokenId, paramAmount: currAmount };
    });

    if (amountsFormatted.length > 1) {
      parseError =
        "Badger Wallet currently only supports sending one coin at a time.  The URI is requesting multiple coins.";
    } else if (amountsFormatted.length === 1) {
      const target = amountsFormatted[0];
      tokenId = target.tokenId;
      amountFormatted = target.paramAmount;
    }

    addressFormatted = tokenId
      ? await addressToSlp(address)
      : await addressToCash(address);

    navigation.navigate("SendSetup", {
      tokenId,
      uriError: parseError,
      uriAddress: typeof addressFormatted === "string" ? addressFormatted : "",
      uriAmount: amountFormatted
    });
  };

  useEffect(() => {
    const navParams = navigation.state.params;

    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);
      if (navParams) {
        handleDeepLink(navParams);
        return;
      }
      navigation.navigate("Main");
    } else {
      navigation.navigate("AuthStack");
    }
  });

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
    tokensById: tokensByIdSelector(state),
    mnemonic: getMnemonicSelector(state)
  };
};
const mapDispatchToProps = {
  getAccount
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AuthLoadingScreen);
