// @flow

import React from "react";

import styled, { ThemeProvider } from "styled-components";
import { Provider } from "react-redux";
import { View } from "react-native";

import AppNavigator from "./navigation/AppNavigator";
import { store } from "./data/store";
import { spaceBadger } from "./themes/spaceBadger";

const AppWrapper = styled(View)`
  flex: 1;
`;

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={spaceBadger}>
        <AppWrapper>
          <AppNavigator />
        </AppWrapper>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
