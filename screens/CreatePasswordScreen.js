// @flow

import React from "react";
import { SafeAreaView, Text, TextInput } from "react-native";

import { connect } from "react-redux";

type Props = {
  accounts: string[]
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
    const { accounts } = this.props;
    const { password1, password2 } = this.state;

    console.log("accoujts");
    console.log(accounts);
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
      </SafeAreaView>
    );
  }
}

const mapStateToProps = state => ({
  accounts: state.accounts.all
});

const mapDispatchtoProps = {};

export default connect(
  mapStateToProps,
  mapDispatchtoProps
)(CreatePasswordScreen);
