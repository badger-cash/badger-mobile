import { toCashAddress, toSlpAddress } from "bchaddrjs-slp";
import bcoin from "bcash";

const generateMnemonic = () => {
  const mnemonic = new bcoin.Mnemonic({
    bits: 128
  });
  return mnemonic.getPhrase();
};

const deriveAccount = (
  mnemonic: string,
  accountIndex: number = 0,
  childIndex: number = 0,
  hdPathString: string
) => {
  if (!mnemonic) {
    throw new Error("Mnemonic required to derive account"); // mnemonic = SLP.Mnemonic.generate(128);
  }

  const mnemonicObj = new bcoin.Mnemonic(mnemonic);
  const master = bcoin.hd.fromMnemonic(mnemonicObj);
  const hdkey = master.derivePath(`${hdPathString}/${accountIndex}'/0`);
  const child = hdkey.derive(childIndex);
  const keyring = bcoin.KeyRing.fromPrivate(child.privateKey);

  const address = keyring.getKeyAddress().toString();
  return {
    mnemonic,
    keypair: keyring,
    address,
    accountIndex
  };
};

const addressToSlp = async (address: string) => {
  return toSlpAddress(address);
};

const addressToCash = async (address: string) => {
  return toCashAddress(address);
};

export { deriveAccount, addressToSlp, addressToCash, generateMnemonic };
