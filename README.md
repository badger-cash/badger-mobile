# Badger Mobile

> Your gateway to the world of Bitcoin Cash (BCH) apps.

Badger Mobile is a Bitcoin Cash (BCH) and Simple Ledger Protocol (SLP) platform. Interact with CashID, collect tokens, and more.

## Local Development

This project use React Native. Please refer to the React Native documentation to get your iOS and Android emulators installed first.

### Steps

- Install iOS/Android emulators
- Install cocoapods if running on iOS

iOS

```bash
> yarn install
> cd ios
> pod install
> cd ..
> yarn run ios
```

Android

```bash
> TO DO
```

### Nuke all and install command, for when things don't work.

```bash
rm -rf node_modules && yarn install && react-native link && cd ios && pod install && cd .. && yarn run ios
```
