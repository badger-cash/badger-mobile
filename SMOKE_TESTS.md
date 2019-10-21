# Smoke Tests

While each release is in internal and alpha testing, all major flows should be tested to ensure Badger is working correct and no use-case is overlooked. On both iOS and Android.  
Add more checks as issues are found and features are added.

## Account Setup

- [ ] After update, ensure the existing account is still logged in without issue
- [ ] Delete the app and do a fresh install, recover an account
- [ ] Create a new account
- [ ] Clear seed phrase backup prompt

## Basic Send Flows

- [ ] Send BCH to `bitcoincash` address
  - [ ] Ensure history and amounts update correct
- [ ] Send SLP to `simpleledger` address
  - [ ] Ensure history and amounts update correct
- [ ] Attempt sending to an invalid address
- [ ] Attempt sending an invalid amount
- [ ] Attempt sending a token from a wallet with 0 BCH balance
- [ ] Send Max of an SLP token
- [ ] Send Max of BCH balance, fr om a wallet which contains 1+ SLP tokens

## Open from URI's

- [ ] Click on a `bitcoincash` URI with no amount
- [ ] Click on a `bitcoincash` URI with amount specified
- [ ] Click on a `simpleledger` URI with no amount
- [ ] Click on a `simpleledger` URI with an amount for a specific token
- [ ] Click on a URI with a malformed address
- [ ] Click on a BIP-70 URI request

## Request Screen

- [ ] Request a BCH amount
  - [ ] Scan QR code
  - [ ] Paste into send flow
- [ ] Request a SLP token amount
  - [ ] Scan QR ode
  - [ ] Paste into send flow

## Menu & Settings

- [ ] Change currency, ensure app looks right after change
- [ ] View Seed Phrase screen
- [ ] Ensure logout works

## History

- [ ] BCH history appears and updates
- [ ] SLP history appears and updates

## BIP-70

- [ ] BCH single output - Multiple payment providers (2+)
- [ ] SLP single output - Low amount
- [ ] SLP multi-output - Low amount
- [ ] BCH single output - More than the wallet has funds for
- [ ] SLP - More than the wallet has funds for
- [ ] SLP - Token which the wallet does not have or is aware of
- [ ] Invalid BIP70 payment request
- [ ] Scan BIP70 request
- [ ] Open BIP70 request from link
- [ ] Paste BIP70 request
