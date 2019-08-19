// @flow
import { SLP } from "./slp-sdk-utils";

const generateMnemonic = () => {
  const mnemonic = SLP.Mnemonic.generate(128);
  return mnemonic;
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
  const seed = SLP.Mnemonic.toSeed(mnemonic);
  const hdWallet = SLP.HDNode.fromSeed(seed, "mainnet");
  const rootNode = SLP.HDNode.derivePath(hdWallet, hdPathString);

  const child = SLP.HDNode.derivePath(
    rootNode,
    `${accountIndex}'/0/${childIndex}`
  );
  const keypair = SLP.HDNode.toKeyPair(child);
  const address = SLP.ECPair.toCashAddress(keypair);

  return { mnemonic, keypair, address, accountIndex };
};

const addressToSlp = async (address: string) => {
  return await SLP.Address.toSLPAddress(address);
};
const addressToCash = async (address: string) => {
  return await SLP.Address.toCashAddress(address);
};

export { deriveAccount, addressToSlp, addressToCash, generateMnemonic };
