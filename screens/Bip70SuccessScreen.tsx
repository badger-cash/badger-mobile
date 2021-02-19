import React from "react";
import styled from "styled-components";
import { ScrollView, SafeAreaView, View } from "react-native";
import { NavigationScreenProps } from "react-navigation";
import FontAwesome from "react-native-vector-icons/FontAwesome";

import { Button, T, H1, Spacer } from "../atoms";

import lang from "../_locales/index";
var tran = new lang("Bip70SuccessScreen");

const ScreenCover = styled(View)`
  flex: 1;
  background-color: ${props => props.theme.primary500};
  padding: 0 16px;
`;

const TopArea = styled(View)``;

const BottomArea = styled(View)``;
const ReceiptArea = styled(View)`
  flex: 1;
  justify-content: center;
`;

type Props = NavigationScreenProps & {
  navigation: {
    state: {
      params: {
        txid: string;
      };
    };
  };
};

const Bip70SuccessScreen = ({ navigation }: Props) => {
  const { txid } = navigation.state.params;
  return (
    <ScreenCover>
      <SafeAreaView
        style={{
          height: "100%"
        }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1
          }}
        >
          <TopArea>
            <Spacer />
            <H1 center type="inverse" weight="bold">
              {tran.getStr("Msg_Success!")}
            </H1>
            <Spacer tiny />
            <T size="large" type="inverse" center>
              {tran.getStr("Payment_sent_to_merchant")}
            </T>
          </TopArea>
          <ReceiptArea>
            <T center type="inverse">
              <FontAwesome name="check-circle" size={96} />
            </T>
            <Spacer />
            <T center type="inverse" size="small" monospace>
              {tran.getStr("Transaction_ID")}
            </T>
            <Spacer tiny />
            <T center type="inverse" size="small" monospace>
              {txid}
            </T>
          </ReceiptArea>
          <BottomArea>
            <Spacer small />
            <Button
              nature="inverse"
              style={{
                marginLeft: 8,
                marginRight: 8
              }}
              onPress={() => navigation.navigate("Home")}
              text={tran.getStr("btn_Finish")}
            />
            <Spacer small />
          </BottomArea>
        </ScrollView>
      </SafeAreaView>
    </ScreenCover>
  );
};

export default Bip70SuccessScreen;
