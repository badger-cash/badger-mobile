// @flow

import React from "react";
import { Icon } from "expo";

import Colors from "../constants/Colors";

type Props = {
  focused: boolean,
  name: string
};

export default class TabBarIcon extends React.PureComponent<Props> {
  render() {
    const { name, focused } = this.props;
    return (
      <Icon.Ionicons
        name={this.props.name}
        size={26}
        style={{ marginBottom: -3 }}
        color={
          this.props.focused ? Colors.tabIconSelected : Colors.tabIconDefault
        }
      />
    );
  }
}
