import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";
import styled from "styled-components";
import { spaceBadger } from "../../themes/spaceBadger";

import T from "../T";
import Spacer from "../Spacer";
import Ionicons from "react-native-vector-icons/Ionicons";

const SWIPEABLE_WIDTH_PERCENT = 78;

const SwipeButtonContainer = styled(View)`
  overflow: visible;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  height: 70px;
  align-self: center;
`;

const SwipeContent = styled(View)`
  border-radius: 45px;
  background-color: ${props => props.theme.primary500};
`;

const SwipeActivity = styled(View)`
  align-items: center;
  justify-content: center;
  align-self: center;
`;

const Swiper = styled(Slider)`
  flex: 1;
  margin-left: 10;
  margin-right: 10;
  align-items: stretch;
  justify-content: center;
  overflow: visible;
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
  const [visible, setVisible] = useState(true);
  const [sliderValue, setSliderValue] = useState(0);

  const sliding = (value: any) => {
    if (value > 90) {
      swipeFn();
      setVisible(false);
    }
    setSliderValue(value);
  };

  const endSlide = () => {
    setSliderValue(0);
  };

  const forwardCircle = () => (
    <Ionicons
      name="ios-chevron-forward-circle"
      size={60}
      color={spaceBadger.fg100}
    />
  );

  return (
    <SwipeButtonContainer>
      <ActivityIndicator
        animating={!visible}
        hidesWhenStopped={true}
        size={visible ? 0 : "large"}
        color="#11a87e"
      />
      <T center={true} weight={"bold"} type={"primary"}>
        {visible ? `Slide ${labelAction}` : ""}
      </T>
      <Spacer tiny />
      {visible && (
        <SwipeContent>
          <Swiper
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={spaceBadger.primary900}
            maximumTrackTintColor={spaceBadger.primary500}
            renderThumbComponent={forwardCircle}
            value={sliderValue}
            onValueChange={value => sliding(value)}
            onSlidingComplete={() => endSlide()}
          />
        </SwipeContent>
      )}
    </SwipeButtonContainer>
  );
};

export default SwipeButtonAtom;
