// @flow

import makeBlockie from "ethereum-blockies-base64";

import ACDCoinImage from "../assets/images/token-icons/959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98.png";
import Bitcoin2Image from "../assets/images/token-icons/1074bafb678b85f90bca79fa201a26011e09bfc6f723b95c770c0850f8d44fe8.png";
import HonestCoinImage from "../assets/images/token-icons/c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479.png";
import HonkTokenImage from "../assets/images/token-icons/f35007140e40c4b6ce4ecc9ad166101ad94562b3e4f650a30de10b8a80c0b987.png";
import LiberlandMeritImage from "../assets/images/token-icons/527a337f34e04b1974cb8a1edc7ca30b2e444bea111afc122259552243c1dbe3.png";
import SLPTorchTokenImage from "../assets/images/token-icons/49be89bbbe018bcfaebcb41cac8340bc555f022b47b922599e510b143603f4b6.png";
import SpiceTokenImage from "../assets/images/token-icons/4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf.png";
import DropTokenImage from "../assets/images/token-icons/0f3f223902c44dc2bee6d3f77d565904d8501affba5ee0c56f7b32e8080ce14b.png";
import SAITokenImage from "../assets/images/token-icons/7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f.png";

import BitcoinCashImage from "../assets/images/icon.png";

const tokenIdImageMap = {
  "1074bafb678b85f90bca79fa201a26011e09bfc6f723b95c770c0850f8d44fe8": Bitcoin2Image,
  "49be89bbbe018bcfaebcb41cac8340bc555f022b47b922599e510b143603f4b6": SLPTorchTokenImage,
  "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf": SpiceTokenImage,
  "527a337f34e04b1974cb8a1edc7ca30b2e444bea111afc122259552243c1dbe3": LiberlandMeritImage,
  "959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98": ACDCoinImage,
  c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479: HonestCoinImage,
  f35007140e40c4b6ce4ecc9ad166101ad94562b3e4f650a30de10b8a80c0b987: HonkTokenImage,
  "0f3f223902c44dc2bee6d3f77d565904d8501affba5ee0c56f7b32e8080ce14b": DropTokenImage,
  "7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f": SAITokenImage
};

let blockieCache = {};

const getTokenImage = (tokenId: ?string) => {
  if (!tokenId) {
    return BitcoinCashImage;
  }
  if (tokenIdImageMap[tokenId]) {
    return tokenIdImageMap[tokenId];
  }

  let blockie = blockieCache[tokenId];
  if (!blockie) {
    const newBlockie = makeBlockie(tokenId);
    blockieCache = { ...blockieCache, [tokenId]: newBlockie };
    blockie = newBlockie;
  }
  const imageSource = { uri: blockie };

  return imageSource;
};
export { tokenIdImageMap, getTokenImage };
