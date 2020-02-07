import styled, { css } from "styled-components";

import { Text, Platform } from "react-native";

export interface BaseTextProps {
  type?: "muted" | "muted2" | "inverse" | "accent" | "primary" | "danger";
  center?: boolean;
  right?: boolean;
  weight?: "bold";
  spacing?: "loose";
  monospace?: boolean;
}

interface TProps extends BaseTextProps {
  size?: "tiny" | "xsmall" | "small" | "large";
}

export const BASE_SIZE = 16;

export const textBase = css<BaseTextProps>`
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
      props.right &&
      css`
        text-align: right;
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

  ${props =>
    props.monospace &&
    css`
      font-family: ${Platform.OS === "ios" ? "Courier" : "monospace"};
    `}

`;

const T = styled(Text)<TProps>`
  ${textBase};
  font-size: ${BASE_SIZE};

  ${props =>
    props.size === "tiny"
      ? css`
          font-size: ${BASE_SIZE * 0.5};
        `
      : props.size === "xsmall"
      ? css`
          font-size: ${BASE_SIZE * 0.75};
        `
      : props.size === "small"
      ? css`
          font-size: ${BASE_SIZE * 0.9};
        `
      : props.size === "large" &&
        css`
          font-size: ${BASE_SIZE * 1.2};
        `}
`;

export default T;
