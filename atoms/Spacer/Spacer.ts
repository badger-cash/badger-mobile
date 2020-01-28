import { View } from "react-native";
import styled, { css } from "styled-components";

// Todo - Refactor all size related props into a single prop.
interface Props {
  large?: boolean;
  small?: boolean;
  tiny?: boolean;
  minimal?: boolean;
  fill?: boolean;
}
const Spacer = styled(View)<Props>`
  margin-bottom: 28px;
  ${props =>
    props.large &&
    css`
      margin-bottom: 48px;
    `}
  ${props =>
    props.small &&
    css`
      margin-bottom: 16px;
    `}
    ${props =>
      props.tiny &&
      css`
        margin-bottom: 8px;
      `}
      ${props =>
        props.minimal &&
        css`
          margin-bottom: 2px;
        `}
    ${props =>
      props.fill &&
      css`
        margin-bottom: 0px;
        flex: 1;
      `}
`;

export default Spacer;
