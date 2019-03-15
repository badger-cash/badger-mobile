import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';


import BITBOXSDK from 'bitbox-sdk'
const BITBOX = new BITBOXSDK;

const deriveAccount = (
  mnemonic = null,
  accountIndex = 0,
  childIndex = 0,
  hdPathString = "m/44'/245'/0'"
) => {
  if (!mnemonic) {
    mnemonic = BITBOX.Mnemonic.generate(128);
  }

  const seed = BITBOX.Mnemonic.toSeed(mnemonic);
  const hdWallet = BITBOX.HDNode.fromSeed(seed, "mainnet");
  const rootNode = BITBOX.HDNode.derivePath(hdWallet, hdPathString);

  const child = BITBOX.HDNode.derivePath(
    this.root,
    `/{accountIndex}'/0/${childIndex}`
  );
  const keypair = BITBOX.HDNode.toKeyPair(child);
  const address = BITBOX.ECPair.toCashAddress(keypair);

  return { mnemonic, keypair, address };
};

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu',
});

export default class App extends Component {
  render() {
    const account = deriveAccount();
    console.log('account derived');
    return (
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to React Native????</Text>
        <Text style={styles.instructions}>To get started, edit App.js</Text>
        <Text style={styles.instructions}>{instructions}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
