// @flow

import React, { Component } from "react";

import styled, { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import { Platform, StyleSheet, Text, StatusBar, View } from "react-native";

import AppNavigator from "./navigation/AppNavigator";
import { store } from "./data/store";
import { spaceBadger } from "./themes/spaceBadger";

const AppWrapper = styled(View)`
  flex: 1;
`;

// Note:  Use this pattern more.
const instructions = Platform.select({
  ios: "Press Cmd+R to reload,\n" + "Cmd+D or shake for dev menu",
  android:
    "Double tap R on your keyboard to reload,\n" +
    "Shake or press menu button for dev menu"
});

class App extends Component {
  render() {
    // const { isLoadingComplete } = this.state;
    // const { skipLoadingScreen } = this.props;
    // if (!isLoadingComplete && !skipLoadingScreen) {
    //   return (
    //     <AppLoading
    //       startAsync={this._loadResourcesAsync}
    //       onError={this._handleLoadingError}
    //       onFinish={this._handleFinishLoading}
    //     />
    //   );
    // } else {
    return (
      <Provider store={store}>
        <ThemeProvider theme={spaceBadger}>
          <AppWrapper>
            {/* <View style={styles.container}> */}
            {/* {Platform.OS === "ios" && <StatusBar barStyle="default" />} */}
            {/* <Text>test test?</Text> */}
            <AppNavigator />
            {/* </View> */}
          </AppWrapper>
        </ThemeProvider>
      </Provider>
    );
    // }
  }
}

export default App;
