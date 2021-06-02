import React, { useState, useEffect } from "react";
import { ActivityIndicator, View, Dimensions } from "react-native";
import styled from "styled-components";

import Swipeable from "react-native-swipeable-patched";
import Ionicons from "react-native-vector-icons/Ionicons";

import T from "../T";

const SWIPEABLE_WIDTH_PERCENT = 78;

const SwipeButtonContainer = styled(View)`
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 32px;
  width: ${SWIPEABLE_WIDTH_PERCENT}%;
  height: 64px;
  align-self: center;
  border-width: 2px;
  border-color: ${props => props.theme.primary300};
`;

const SwipeContent = styled(View)<{ activated: boolean }>`
  height: 64px;
  padding-right: 10px;
  align-items: flex-end;
  justify-content: center;

  background-color: ${props =>
    props.activated ? props.theme.success500 : props.theme.pending500};
`;

const SwipeMainContent = styled(View)<{ triggered: boolean }>`
  height: 64px;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  background-color: ${props =>
    props.triggered ? props.theme.success500 : props.theme.primary500};
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
  controlledState?: ButtonStates;
  labelAction: string;
  labelRelease: string;
  labelHalfway: string;
}

const SwipeButton = ({
  swipeFn,
  controlledState,
  labelAction,
  labelRelease,
  labelHalfway
}: Props) => {
  const [state, setState] = useState<ButtonStates>(controlledState);
  const [swipeActivated, setSwipeActivated] = useState(false);

  useEffect(() => {
    if (controlledState) setState(controlledState);
  }, [controlledState]);

  return (
    <SwipeButtonContainer>
      {state === "pending" ? (
        <ActivityIndicator size="large" color="#11a87e" />
      ) : (
        <Swipeable
          leftActionActivationDistance={
            Dimensions.get("window").width *
            (SWIPEABLE_WIDTH_PERCENT / 100) *
            0.7
          }
          leftContent={
            <SwipeContent activated={swipeActivated}>
              {swipeActivated ? (
                <T weight="bold" type="inverse">
                  {labelRelease}
                </T>
              ) : (
                <T weight="bold" type="inverse">
                  {labelHalfway}
                </T>
              )}
            </SwipeContent>
          }
          onLeftActionActivate={() => setSwipeActivated(true)}
          onLeftActionDeactivate={() => setSwipeActivated(false)}
          onLeftActionComplete={swipeFn}
        >
          <SwipeMainContent triggered={state === "activated"}>
            <T weight="bold" type="inverse">
              Swipe{" "}
            </T>
            <T
              weight="bold"
              type="inverse"
              style={{
                paddingTop: 2
              }}
            >
              <Ionicons name="ios-arrow-forward-circle-outline" size={25} />
            </T>
            <T weight="bold" type="inverse">
              {" "}
              {labelAction}
            </T>
          </SwipeMainContent>
        </Swipeable>
      )}
    </SwipeButtonContainer>
  );
};

export default SwipeButton;
