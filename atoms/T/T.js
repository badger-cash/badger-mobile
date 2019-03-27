// @flow

import styled, { css } from "styled-components";

import { Text } from "react-native";

const T = styled(Text)`
  font-size: 18;
  ${props =>
    props.center &&
    css`
      text-align: center;
    `}
`;

export default T;
