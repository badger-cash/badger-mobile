# Badger Wallet - Changelog

## 0.14.1

- Optionally hide specific SLP tokens from the main screen

## 0.14.0

- Now in TypeScript, the code is much more maintainable now
- Account recovery and transaction history speed improvements
- Many minor bugs fixed

## 0.13.0

- Sweep SLP tokens from paper wallets, enabling more real life tipping options
- Speed improvements when creating and restoring wallets, no longer freezing old phones
- More token icons
- Fixing missing error message issue

## 0.12.6

- Restrict sending BCH to cash addresses
- Restrict sending SLP to simpleledger addresses
- Confirmation counts in transaction history
- Adding more token icons
  - GOC, LEAD
- Some BIP70 improvements for optional fields

## 0.12.5

- Updated receive screen
- Removed largest cause of slowdown - repeated history updates

## 0.12.0

- BIP-70 support
  - Single & multi-output BCH
  - Single & multi-output SLP
  - Open from a URI, scan, or paste the payment request to access.
- History improvements, especially for multi-output
- Minor UI & UX fixes

## 0.11.0

- Larger QR codes
- Slide to send improvements
  - Activates earlier in swipe
- FAQ Page to address common questions
- Direct link to explorer from each transaction
- Paper Wallet Sweeping screen added

## 0.10.3

- React Native 0.60 upgrade
  - Smaller builds
  - Faster app
- Improved history screen
  - Detects self send
  - Basic payout detection
- SLP unknown types un-spendable

## 0.9.0

- Request amount of any token from the detail screen
- Scan and parse URI's and QR codes for SLP tokens
- Open Badger Wallet directly from any valid URI
- Adding in more token icons
- Icon is now centered correctly

## 0.8.0

- Re-branding full app and BCH references from the previous orange colour to the new exciting green colour.

## 0.7.1

- Fixing an edge case app crash

## 0.7.0

### Features / Improvements

- Currency select screen from Menu
- Change to any base currency to display your BCH balance as.
  - At first enabling a whitelist of 24 top used currencies
- Number formatting improvements throughout to better match selected currency
- Improved fee calculations when sending SLP

### Bug fixes

- Updating bitbox-sdk to reduce server load
- Fixed SLP issue sending tokens when user has a large number of SLP related UTXO
- Fixed bug where new users see negative balance in sending flow
- Allow sending non fungible tokens without ticker symbols
- Fixed bug where app crashes when accessing an SLP token before it's data is loaded

## 0.6.2 and earlier

- Initial versions of Badger Wallet for both iOS and Android
- Android Beta release
- iOS Beta release
