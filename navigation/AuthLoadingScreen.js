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

    const amounts = Object.entries(params).filter(
      ([key: string, val: string]) => key.startsWith("amount")
    );

    // Only support sending one token type or BCH at a time
    const { amountFormatted, tokenId } = amounts.reduce(
      (acc, curr) => {
        if (acc.tokenId && acc.amountFormatted) return acc;

        let nextTokenId = null;
        let nextAmount = null;

        const amountRaw = curr[1];
        if (amountRaw.includes("-")) {
          [nextAmount, nextTokenId] = amountRaw.split("-");
        } else {
          nextAmount = amountRaw;
        }
        return {
          tokenId: nextTokenId,
          amountFormatted: nextAmount
        };
      },
      { tokenId: null, amountFormatted: null }
    );

    const ticker = tokenId
      ? tokensById[tokenId]
        ? tokensById[tokenId].symbol
        : "---"
      : "BCH";

    const formattedAddress = tokenId
      ? await addressToSlp(address)
      : await addressToCash(address);

    navigation.navigate("SendSetup", {
      symbol: ticker,
      tokenId,
      uriAddress: typeof formattedAddress === "string" ? formattedAddress : "",
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
