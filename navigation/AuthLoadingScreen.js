// @flow

import React, { useEffect } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { ActivityIndicator, View } from "react-native";

import { T, Spacer } from "../atoms";
import { getMnemonicSelector } from "../data/accounts/selectors";
import { getAccount } from "../data/accounts/actions";
import { tokensByIdSelector } from "../data/tokens/selectors";

import { parseAddress, getType, parseSLP } from "../utils/schemeParser-utils";

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
  navigation: { navigate: Function },
  mnemonic: string,
  getAccount: Function
};

const handleDeepLink = (navigation, params, tokensById) => {
  const { address } = params;

  const type = getType(address);

  if (type === "cashaddr") {
    params.address = parseAddress(params.address);
    navigation.navigate("SendStack", params);
  }
  if (type === "slpaddr") {
    params = parseSLP(params, tokensById);
    navigation.navigate("SendStack", params);
  }

  navigation.navigate("SendStack", params);
};

const AuthLoadingScreen = ({
  navigation,
  mnemonic,
  getAccount,
  tokensById
}: Props) => {
  useEffect(() => {
    const params =
      navigation.state.params !== undefined ? navigation.state.params : "";
    const hasParams = params !== "";

    if (mnemonic) {
      // re-generate accounts keypair then go to Main.
      getAccount(mnemonic);
      if (hasParams) {
        handleDeepLink(navigation, params, tokensById);
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
