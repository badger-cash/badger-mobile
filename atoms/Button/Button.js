// @flow

import styled from "styled-components";
import { TouchableOpacity } from "react-native";

const Button = styled(TouchableOpacity)`
  border-width: 2px;
  border-color: ${props => props.theme.fg300};
  padding: 6px 10px;
  border-radius: 4px;
`;

export default Button;
