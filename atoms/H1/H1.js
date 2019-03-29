// @flow

import styled, { css } from "styled-components";

import { Text } from "react-native";

const H1 = styled(Text)`
  font-size: 32;
  color: ${props => props.theme.fg100};
  ${props =>
    props.center &&
    css`
      text-align: center;
    `}
`;

export default H1;
