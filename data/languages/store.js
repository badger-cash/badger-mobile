"use strict";
var React = require("react-native");
var { AsyncStorage } = React;

async function store(key, value) {
  AsyncStorage.setItem(key, value);
}
async function get(key) {
  let data = await AsyncStorage.getItem(key);
  return data;
}

export { get, store };
