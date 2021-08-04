import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, Dimensions } from "react-native";
import Slider from "@react-native-community/slider";
import styled from "styled-components";
import { spaceBadger } from "../../themes/spaceBadger";

import T from "../T";
import Spacer from "../Spacer";

const arrowIcon = require("../../assets/images/icons/forward_150.png");

const SWIPEABLE_WIDTH_PERCENT = 78;

const SwipeButtonContainer = styled(View)`
  overflow: visible;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  height: 70px;
  align-self: center;
`;

const SwipeContent = styled(View)`
  border-radius: 45px;
  align-items: center;
  align-content: center;
  justify-content: center;

  background-color: ${props => props.theme.primary500};
`;

const SwipeActivity = styled(View)`
  align-items: center;
  justify-content: center;
  align-self: center;
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

  const sliding = (value: Number) => {
    if (value > 90) {
      swipeFn();
      setVisible(false);
    }
  };

  const endSlide = (value: Number) => {
    setSliderValue(1);
    setSliderValue(0);
  };

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
          <Slider
            style={{ width: "90%", height: "50%", overflow: "visible" }}
            thumbImage={arrowIcon}
            value={sliderValue}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor={spaceBadger.primary900}
            maximumTrackTintColor={spaceBadger.primary500}
            onValueChange={value => sliding(value)}
          />
        </SwipeContent>
      )}
    </SwipeButtonContainer>
  );
};

export default SwipeButtonAtom;
