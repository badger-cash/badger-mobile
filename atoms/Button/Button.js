// @flow
import * as React from "react";

import styled, { css } from "styled-components";
import { TouchableOpacity, StyleSheet } from "react-native";
import T from "../T";

const StyledButton = styled(TouchableOpacity)`
  border-width: ${StyleSheet.hairlineWidth};
  min-width: 135px;

  padding: 8px 12px;
  border-radius: 3px;
  justify-content: center;
  ${props =>
    props.nature === "primary"
      ? css`
          background-color: ${props.theme.primary500};
        `
      : props.nature === "cautionGhost"
      ? css`
          background-color: transparent;
          border-color: ${props.theme.accent500};
        `
      : props.nature === "ghost"
      ? css`
          background-color: transparent;
          border-color: ${props.theme.primary500};
        `
      : props.nature === "inverse"
      ? css`
          background-color: ${props => props.theme.bg900};
          border-color: ${props.theme.primary700};
        `
      : css`
          border-color: ${props.theme.primary500};
          background-color: ${props.theme.primary500};
        `}
`;

type Props = {
  text?: string,
  children?: React.Node,
  nature?: "primary" | "caution" | "cautionGhost" | "ghost" | "inverse",
  onPress: Function
};

const Button = ({ text, children, nature, ...rest }: Props) => {
  const textType =
    nature === "cautionGhost"
      ? "accent"
      : nature === "inverse"
      ? "primary"
      : "inverse";
  return (
    <StyledButton nature={nature} {...rest}>
      {children ? (
        children
      ) : (
        <T type={textType} weight="bold" spacing="loose" center>
          {text}
        </T>
      )}
    </StyledButton>
  );
};

export default Button;
