import styled from "styled-components";

import { Text } from "react-native";

import { BASE_SIZE, textBase } from "../T";

const H2 = styled(Text)`
  ${textBase}
  font-size: ${BASE_SIZE * 1.5};
`;

export default H2;
