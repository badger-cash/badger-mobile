// @flow

// import KeyringController from 'bch-keyring-controller';
import { store } from '../data/store';

import BITBOXSDK from 'bitbox-sdk';

const BITBOX= new BITBOXSDK();

const deriveAccount = (mnemonic = null, accountIndex = 0, childIndex = 0, hdPathString = "m/44'/245'/0'") => {

  if (!mnemonic) {
    mnemonic = BITBOX.Mnemonic.generate(128)
  }

  const seed = BITBOX.Mnemonic.toSeed(mnemonic)
  const hdWallet = BITBOX.HDNode.fromSeed(seed, 'bitcoincash')
  const rootNode = BITBOX.HDNode.derivePath(hdWallet, hdPathString)

  const child = BITBOX.HDNode.derivePath(this.root, `/{accountIndex}'/0/${childIndex}`)
  const keypair = BITBOX.HDNode.toKeyPair(child)
  const address = BITBOX.ECPair.toCashAddress(keypair)

  return { mnemonic, keypair, address }
}


export { deriveAccount };
