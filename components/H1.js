// @flow

import React from "react";
import styled, { css } from "styled-components";

import { Text, Platform } from "react-native";

const H1 = styled(Text)`
  font-size: 36;
  ${Platform.select({
    ios: css`
      font-family: Helvetica;
    `,
    android: css`
      font-family: Roboto;
    `
  })};
`;

export { H1 };
