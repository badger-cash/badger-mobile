// @flow

import styled, { css } from "styled-components";

import { Text } from "react-native";

import { BASE_SIZE, textBase } from "../T";

const H1 = styled(Text)`
  ${textBase};
  font-size: ${BASE_SIZE * 2};
  ${props =>
    props.spacing === "loose" &&
    css`
      letter-spacing: 2.5;
    `}
`;

export default H1;
