// @flow

import React from "react";
import { SafeAreaView, Text, TextInput, Button } from "react-native";

import { connect } from "react-redux";

import { getAccount } from "../data/accounts/actions";

// import { getAccount } from "../utils/keyring";

type Props = {
  accounts: string[],

  createNewVaultAndKeychain: Function
};
type State = {
  password1: string,
  password2: string
};

class CreatePasswordScreen extends React.Component<Props, State> {
  state = {
    password1: "",
    password2: ""
  };

  render() {
    const { accounts, createNewVaultAndKeychain } = this.props;
    const { password1, password2 } = this.state;

    return (
      <SafeAreaView>
        <Text>Create Password</Text>
        <TextInput
          secureTextEntry
          onChangeText={text => this.setState({ password1: text })}
          value={password1}
          placeholder="Enter password"
          style={{ width: "100%", backgroundColor: "#eee" }}
        />
        <TextInput
          secureTextEntry
          onChangeText={text => this.setState({ password2: text })}
          value={password2}
          placeholder="Confirm password"
          style={{ width: "100%", backgroundColor: "#eee" }}
        />

        {password1 && password2 && password1 === password2 ? (
          <Text>Match</Text>
        ) : (
          <Text>No Match</Text>
        )}
        <Button onPress={() => getAccount()} title="Create" />
      </SafeAreaView>
    );
  }
}

const mapStateToProps = state => ({
  accounts: state.accounts.all
});

const mapDispatchtoProps = {
  getAccount
};

export default connect(
  mapStateToProps,
  mapDispatchtoProps
)(CreatePasswordScreen);
