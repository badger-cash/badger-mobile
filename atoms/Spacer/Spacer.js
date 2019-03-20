// @flow

import { View } from "react-native";
import styled, { css } from "styled-components";

const Spacer = styled(View)`
  margin-bottom: 28px;
  ${props =>
    props.large &&
    css`
      margin-bottom: 48px;
    `}
  ${props =>
    props.small &&
    css`
      margin-bottom: 15px;
    `}
`;

export default Spacer;
