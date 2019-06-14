# Badger Mobile

> Your gateway to the world of Bitcoin Cash (BCH) apps.

Badger Mobile is a Bitcoin Cash (BCH) and Simple Ledger Protocol (SLP) wallet. The easiest to use mobile wallet for BCH and SLP tokens.

## Technologies / Patterns

### Data

All data which lives longer than a single screen is stored in `redux`, the structure of which can be found in the `/data` folder.

### Local State and React Lifecycle Pattern

Only use `Functional Components` with React and stick to using the `hook` patterns.  
Keeping to this single pattern will make the code very consistent and future-proof as this is the direction React is going.

### Styling

All styles are done through `Styled Components` within their respective files. This will keep all styles local, and re-useable.  
Most of the base components we re-use should be turned into atoms and put into the `/atoms` folder.  
If we want to re-use variables throughout the app, like color or spacing, we should define them in one of the `./themes` for easier application wide modifications.

### Navigation

Navigation is handled by `react-navigation` and all navigation setup logic should be contained within the `/navigation` folder.

## Local Development

This project use React Native. Please refer to the React Native documentation to get your iOS and Android emulators installed first.

### Steps

- [React Native Getting Started Docs](https://facebook.github.io/react-native/docs/getting-started)
- Install iOS/Android emulators
- Install cocoapods if running on iOS
- Be sure to set \$PATH if running on Android

iOS

```bash
> yarn install
> cd ios
> pod install
> cd ..
> yarn run ios

To run on a specific device
> yarn run ios --simulator="iPhone Xs Max"
> yarn run ios --simulator="iPhone 8 Plus"
> yarn run ios --simulator="iPhone 6"
> yarn run ios --simulator="iPhone SE"
> yarn run ios --simulator="iPhone X"

Deploy Steps
> Load project in XCode
> Update version number
> Product > archive
> Sign with deployment keys
> Launch from web console to testflight & release

```

Android

```bash
> yarn install
> yarn run android

For a simple .apk
> Follow the steps at https://facebook.github.io/react-native/docs/signed-apk-android
> generate badger-mobile-release.keystore and put into /android <- Should use the one already used for deployments
> update android/grade.properties with the keystore filename and password
> Suggestion to not commit secrets: `git update-index --assume-unchanged android/gradle.properties`
> Increment `versionCode` in android/app/build.gradle
> cd android
> ./gradlew assembleRelease

> Go to Play console
> Upload each build version for release
> Launch to Beta group, then production

To run production build locally
> Ensure emulator is running or device is plugged in
> react-native run-android --variant=release
> react-native log-android
```

### Icon / Splash Screen Generation

- https://github.com/bamlab/generator-rn-toolbox

### Nuke all and install command, for when things don't work

```bash
rm -rf node_modules && yarn install && react-native link && cd ios && pod install && cd .. && yarn run ios
```
