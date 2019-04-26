// @flow

import styled, { css } from "styled-components";

import { Text } from "react-native";

const T = styled(Text)`
  font-size: 18;
  color: ${props =>
    props.type === "muted"
      ? props.theme.fg200
      : props.type === "muted2"
      ? props.theme.fg300
      : props.type === "inverse"
      ? props.theme.bg900
      : props.type === "accent"
      ? props.theme.accent500
      : props.type === "primary"
      ? props.theme.primary500
      : props.type === "danger"
      ? props.theme.danger300
      : props.theme.fg100};
  ${props =>
    props.center &&
    css`
      text-align: center;
    `}
  ${props =>
    props.size === "tiny"
      ? css`
          font-size: 8;
        `
      : props.size === "xsmall"
      ? css`
          font-size: 10;
        `
      : props.size === "small"
      ? css`
          font-size: 14;
        `
      : props.size === "large" &&
        css`
          font-size: 22;
        `}
    ${props =>
      props.weight === "bold" &&
      css`
        font-weight: 700;
      `}
    ${props =>
      props.spacing === "loose" &&
      css`
        letter-spacing: 1;
      `}
`;

export default T;
