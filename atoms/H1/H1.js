// @flow

import styled, { css } from "styled-components";

import { Text } from "react-native";

import { BASE_SIZE } from "../T";

const H1 = styled(Text)`
  font-size: ${BASE_SIZE * 2};
  color: ${props => props.theme.fg100};
  ${props =>
    props.center &&
    css`
      text-align: center;
    `}
`;

export default H1;
