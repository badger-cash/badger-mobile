// @flow

import "./shim";

import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

console.log("after imports");

AppRegistry.registerComponent(appName, () => App);
