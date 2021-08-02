import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, Dimensions } from "react-native";
import styled from "styled-components";

// import Swipeable from "react-native-swipeable-patched";
import Ionicons from "react-native-vector-icons/Ionicons";

import SwipeButton from "rn-swipe-button";

import T from "../T";

const SWIPEABLE_WIDTH_PERCENT = 78;

const SwipeButtonContainer = styled(View)`
  overflow: hidden;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  height: 64px;
  align-self: center;
`;

const SwipeContent = styled(View)<{ activated: boolean }>`
  height: 64px;
  padding-right: 10px;
  align-items: flex-end;
  justify-content: center;

  background-color: ${props =>
    props.activated ? props.theme.success500 : props.theme.pending500};
`;

const SwipeActivity = styled(View)`
  height: 64px;
  align-items: center;
  justify-content: center;
  align-self: center;
  flex-direction: row;
`;

type ButtonStates =
  | "neutral"
  | "activated"
  | "success"
  | "error"
  | "pending"
  | undefined;

interface Props {
  swipeFn(): void;
  labelAction: string;
}

const SwipeButtonAtom = ({ swipeFn, labelAction }: Props) => {
  const forwardCircle = () => (
    <Ionicons name="ios-arrow-forward-circle" size={25} color="#11a87e" />
  );

  return (
    <SwipeButtonContainer>
      <SwipeButton
        onSwipeSuccess={() => swipeFn()}
        swipeSuccessThreshold={70}
        titleColor="#FFFFFF"
        railBackgroundColor="#11a87e"
        railBorderColor="#11a87e"
        railFillBackgroundColor="#FFFFFF"
        railFillBorderColor="#FFFFFF"
        thumbIconBackgroundColor="#FFFFFF"
        thumbIconComponent={forwardCircle}
        title={`Slide ${labelAction}`}
      />
    </SwipeButtonContainer>
  );
};

export default SwipeButtonAtom;
