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

// import {
//   parseAddress,
//   parseBCHScheme,
//   getType,
//   parseSLP
// } from "../utils/schemeParser-utils";
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
    // const { address } = params;

    // const type = getType(address);

    // console.log(type)

    // if (type === "cashaddr") {
    //   console.log('cashaddr')
    //   params = parseBCHScheme(params)
    //   // params.address = parseAddress(params.address);
    // }
    // if (type === "slpaddr") {
    //   console.log('slpAddr')
    //   params = parseSLP(params);
    // }

    console.log("IN DEEP LINK");
    console.log(params);
    const { address, amount, amount1 } = params;

    const amounts = Object.entries(params).filter(
      ([key: string, val: string]) => key.startsWith("amount")
    );

    // Only support sending one token type or BCH at a time
    const { amountFormatted, tokenId } = amounts.reduce(
      (acc, curr) => {
        if (acc.tokenId || acc.amountFormatted) return acc;

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

    console.log("amounts");
    console.log(amounts);

    // const formattedAmount = amount ? amount : amount1 && amount1.split("-")[0];

    // const tokenId = amount1 && amount1.split("-")[1];

    const ticker = tokenId
      ? tokensById[tokenId]
        ? tokensById[tokenId].symbol
        : "---"
      : "BCH";
    console.log({ tokenId, amount, amount1, amountFormatted });

    const formattedAddress = tokenId
      ? await addressToSlp(address)
      : await addressToCash(address);
    console.log(formattedAddress);

    // compute ticker and tokenId, add amount support for this also.
    navigation.navigate("SendSetup", {
      uriAddress: formattedAddress,
      symbol: ticker,
      tokenId,
      uriAmount: amountFormatted
    });

    // navigation.navigate("SendSetup", params);
  };

  useEffect(() => {
    const navParams = navigation.state.params;

    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);

      console.log("AUTH LOADING");
      console.log(navParams);
      console.log("!!!!!");
      if (navParams) {
        console.log("handle deep link");
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
