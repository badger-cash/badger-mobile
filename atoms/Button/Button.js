// @flow
import * as React from "react";

import styled from "styled-components";
import { TouchableOpacity } from "react-native";
import T from "../T";

const StyledButton = styled(TouchableOpacity)`
  border-width: 2px;
  border-color: ${props => props.theme.fg300};
  padding: 6px 10px;
  border-radius: 4px;
`;

type Props = {
  text?: string,
  children?: React.Node,
  onPress: Function
};

const Button = ({ text, children, ...rest }: Props) => {
  return (
    <StyledButton {...rest}>
      {children ? children : <T center>{text}</T>}
    </StyledButton>
  );
};

export default Button;
