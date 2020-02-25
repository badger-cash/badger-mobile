# Badger Mobile Wallet

> Your gateway to the world of Bitcoin Cash (BCH) apps.

Badger Mobile Wallet is a Bitcoin Cash (BCH) and Simple Ledger Protocol (SLP) wallet. Designed to be simple and straightforward to highlight exciting world of BCH and SLP.

## Feature Highlights

- BCH Wallet
  - Wallet on 145 derivation path
  - Multi-currency fiat conversions for display
- SLP vault
  - Wallet on 245 derivation path
  - All of your SLP tokens in one place
- BIP70 support
  - BCH
  - SLP
- Paper wallet wif sweeping
  - BCH - Bitcoin Cash paper wallets
  - SLP - Simple Token paper wallets

## Application Overview

### Primary Technology

- react-native
  - redux
  - react-navigation
  - styled-components
- bitbox-sdk
- slp-sdk
- prettier
- yarn
- TypeScript

### File Structure

- `/`
  - Configuration files and project setup
  - `assets/`
    - Images and fonts packaged with the app
  - `/atoms/`
    - Lowest level UI components, such as Text, Buttons, Spacer, etc
  - `/components/`
    - UI components used throughout the app, should be mainly composed of atoms with additional logic
  - `/data/`
    - The redux store, and all data management logic
  - `/navigation/`
    - The router of the application
  - `/screens/`
    - Top level screens, these are what the navigation renders
  - `/themes/`
    - App color files
  - `/hooks/`
    - Custom react hooks
  - `/utils/`
    - Utility methods, mainly for Bitcoin Cash (BCH) related logic
  - `/ios/`
    - iOS specific project files, modify these through xCode
  - `/android/`
    - Android specific project files

### Data

All data which lives longer than a single screen is stored in `redux`, the structure of which can be found in the `/data` folder.

### Local State and React Lifecycle

Only use `Functional Components` with React and stick to using the `hook` paradigm; except for rare exceptions.  
Keeping the entire app on this single pattern will make the code more consistent, future-proof, and easier to maintain.

### Styling

All styling is done with the `styled-components` library.  
Most of the base components we reuse should be turned into atoms and put into the `/atoms` folder.

To reuse variables throughout the app (like colo and spacing), define them in one of the `./themes` files.

### Navigation

Navigation is managed with the `react-navigation` library. To contain the logic of navigation in a single place, keep all navigation and router setup in the `/navigation` folder.

## Development Setup

This project use `react-native`. Please refer to the React Native documentation to get the iOS or Android emulator installed and running before running `badger-mobile`

### Initial Setup

- [React Native Getting Started Docs](https://facebook.github.io/react-native/docs/getting-started)
- Install TypeScript
- Install iOS/Android emulators
- Install cocoapods if running on iOS
- Be sure to set \$PATH if running on Android

### iOS Setup

```bash
> yarn install
> cd ios
> pod install
> cd ..
> yarn run ios
```

#### Different iOS Device

```bash
> yarn run ios --simulator="iPhone 11 Pro Max"
> yarn run ios --simulator="iPhone 11 Pro"
> yarn run ios --simulator="iPhone 8 Plus"
> yarn run ios --simulator="iPhone 6"
> yarn run ios --simulator="iPhone SE"
> yarn run ios --simulator="iPhone X"
```

#### iOS Store Deployment

1. Load project in XCode
1. Update version & build numbers
1. Product > archive project
1. Sign with deployment keys
1. Go to the [Apple web console](https://appstoreconnect.apple.com) to create release
1. Test on testflight
1. Release to production

### Android Setup

#### Generate Debug Keystore

- Required for local development
- Generate a debug keystore in `android/app`
  1. `cd android/app`
  1. `keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000`

#### Setup Release Keystore

1. Required for releases
1. Follow the [steps to sign an apk](https://facebook.github.io/react-native/docs/signed-apk-android)
1. generate or place the `badger-mobile-release.keystore` file and put into `/android/app`
   - Get this from the project lead
1. update `android/gradle.properties` with the keystore filename and password. Template below.

#### `gradle.properties` Template

```bash
MYAPP_RELEASE_STORE_FILE=badger-mobile-release.keystore
MYAPP_RELEASE_KEY_ALIAS=badger-mobile-release
MYAPP_RELEASE_STORE_PASSWORD= - - - - - - - - - -
MYAPP_RELEASE_KEY_PASSWORD= - - - - - - - - - -
```

- Suggestion to not commit secrets by mistake: `git update-index --assume-unchanged android/gradle.properties`

### Android Local Install

```bash
> yarn install
> Start an Android device - either
  > Android emulator from Android Studio
  > Physical device with USB debugging enabled
> yarn run jetify
 > jetify only required once
> yarn run android
```

### Create Bundles'n'Builds

- Increment `versionCode` in `android/app/build.gradle`
- Build .apk
  - The `.apk` file is good for distributing online, or for sending to people direct to sideload.
  - `> yarn run android-build`
- Bundle the build
  - The bundle is be used to distributed on the Play Store.
  - `> yarn run android-bundle`

#### Android Store Deployment

- Go to [Play console](https://play.google.com/apps/publish/)
- Upload the `bundle` to a new `internal test release`
- Launch to internal test group
- QA - and testing
- Fix issues, repeat from beginning
- Launch to beta
- Launch to production
- Update the universal `.apk` on badger.bitcoin.com
