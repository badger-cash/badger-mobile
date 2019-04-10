// @flow

// import BITBOXSDK from "bitbox-sdk";
import SLPSDK from "slp-sdk";

const SLP = new SLPSDK();

// const BITBOX = new BITBOXSDK();

const deriveAccount = (
  mnemonic: ?string = null,
  accountIndex: number = 0,
  childIndex: number = 0,
  hdPathString: string = "m/44'/245'"
) => {
  if (!mnemonic) {
    mnemonic = SLP.Mnemonic.generate(128);
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

  return { mnemonic, keypair, address };
};

const addressToSlp = async (address: string) => {
  return await SLP.Address.toSLPAddress(address);
};

export { deriveAccount, addressToSlp };
