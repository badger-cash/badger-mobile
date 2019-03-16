// @flow

import React from "react";
import styled, { css } from "styled-components";

import { Text, Platform } from "react-native";

const T = styled(Text)`
  font-size: 18;
  ${Platform.select({
    ios: css`
      font-family: Helvetica;
    `,
    android: css`
      font-family: Roboto;
    `
  })};
`;

export { T };
