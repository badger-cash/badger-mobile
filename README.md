# Badger Wallet

> Your gateway to the world of Bitcoin Cash (BCH) apps.

Badger Wallet is a Bitcoin Cash (BCH) and Simple Ledger Protocol (SLP) wallet. The easiest to use mobile wallet for BCH and SLP tokens.

## App Structure

Badger Wallet mobile app is primarily built on the following technologies.

- react-native
  - redux
  - react-navigation
  - styled-components
- bitbox-sdk
- slp-sdk
- flowjs
- prettier
- yarn

The file structure is as follows...

```bash
/
  - Config files and project setup
  /assets/
    - Images and fonts packaged with the app
  /atoms/
    - Lowest level UI components, such as Text, Buttons, Spacer, etc
  /components/
    - UI components used throughout the app, should be mainly composed of atoms with additional logic
  /data/
    -The Redux store, and all data management logic
  /navigation/
    - The router of the application
  /screens/
    - Top level screens, these are what the navigation renders
  /themes/
    - App color files
  /utils/
    - Utility methods, mainly for Bitcoin Cash (BCH) related logic
  /ios/
    - iOS specific project files, modify these through xCode
  /android/
    - Android specific project files
```

### Data

All data which lives longer than a single screen is stored in `redux`, the structure of which can be found in the `/data` folder.

### Local State and React Lifecycle

Only use `Functional Components` with React and stick to using the `hook` patterns for component lifecycle management.  
Keeping to this single pattern will make the code consistent and future-proof as this is the direction React is going.

### Styling

All styling is done with the `styled-components` library.  
Most of the base components we reuse should be turned into atoms and put into the `/atoms` folder.

To reuse variables throughout the app -like color or spacing - define them in one of the `./themes`.

### Navigation

Navigation is managed with the `react-navigation` library. To contain the logic of navigation in a single place, keep all navigation/router setup in the `/navigation` folder.

## Local Development

This project use `react-native`. Please refer to the React Native documentation to get the iOS or Android emulator installed and running before running `badger-mobile`

#### Initial Setup

- [React Native Getting Started Docs](https://facebook.github.io/react-native/docs/getting-started)
- Install iOS/Android emulators
- Install cocoapods if running on iOS
- Be sure to set \$PATH if running on Android

#### iOS steps

```bash
> yarn install
> cd ios
> pod install
> cd ..
> yarn run ios
```

To run on a specific device, such as required for taking screenshots for the store (6.5" & 5.5"). Xs Max and iPhone 8 plus are good store screenshot phones.

```bash
> yarn run ios --simulator="iPhone 11 Pro Max"
> yarn run ios --simulator="iPhone 11 Pro"
> yarn run ios --simulator="iPhone 8 Plus"
> yarn run ios --simulator="iPhone 6"
> yarn run ios --simulator="iPhone SE"
> yarn run ios --simulator="iPhone X"
```

#### Store Deploy steps

- Load project in XCode
- Update version number
- Product > archive project
- Sign with deployment keys
- Go to the [Apple web console](https://appstoreconnect.apple.com) to create release

#### Android Local

- Generate a debug keystore in `android/app`

  - `cd android/app`
  - `keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000`

```bash
> yarn install
> Start an Android device - either
  > Start an Android emulator from Android Studio
  > Or plug in an Android device + enable USB debugging
> yarn run jetify
> yarn run android
```

#### Android .apk

- Follow the steps at https://facebook.github.io/react-native/docs/signed-apk-android
- generate `badger-mobile-release.keystore` file and put into `/android/app`
- update `android/gradle.properties` with the keystore filename and password

```bash
MYAPP_RELEASE_STORE_FILE=badger-mobile-release.keystore
MYAPP_RELEASE_KEY_ALIAS=badger-mobile-release
MYAPP_RELEASE_STORE_PASSWORD=**********
MYAPP_RELEASE_KEY_PASSWORD=**********
```

- Suggestion to not commit secrets by mistake: `git update-index --assume-unchanged android/gradle.properties`
- Increment `versionCode` in android/app/build.gradle

##### Build .apk

```bash
cd android
./gradlew assembleRelease
or
yarn run android-build
```

##### Build bundle

```bash
cd android
./gradlew bundleRelease
or
yarn run android-bundle
```

##### Distribute

- Go to [Play console](https://play.google.com/apps/publish/)
- Upload the `bundle` for release
- Launch to Internal Test group
- QA
- Launch to production
- Update the universal `.apk` on badger.bitcoin.com

##### To run production build locally

- Ensure emulator is running or device is plugged in
- `react-native run-android --variant=release`
- `react-native log-android`

### Asset / Icon / Splash Screen Generation

- Android Studio has a built in asset management tool, use that.
- iOS convert icons to appropriate sizes, then upload through xCode

###### Nuke All and Reset Local Environment

```bash
rm -rf node_modules && yarn install && cd ios && pod install && cd .. && yarn run ios
```
