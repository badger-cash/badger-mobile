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
import GOCTokenImage from "../assets/images/token-icons/3f83fa9f168f01d68933ef5fdb77143b2376ba7bf3a78175258861982d90d500.png";
import LEADTokenImage from "../assets/images/token-icons/29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006.png";
import ZBCHTokenImage from "../assets/images/token-icons/f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec.png";
import HonkHonkTokenImage from "../assets/images/token-icons/7f8889682d57369ed0e32336f8b7e0ffec625a35cca183f4e81fde4e71a538a1.png";
import MiamiTokenImage from "../assets/images/token-icons/eebaa04d0e715b7bd21901cb60e10d7f71d219626daf24c57ce6ea9584333149.png";
import ForkTokenImage from "../assets/images/token-icons/4bad853480dd5c52871ee3c2e779f78c7b43912cca974211d10b50fec9d6f81b.png";
import HamTokenImage from "../assets/images/token-icons/6ef92fa35cf791a6ae26fab62c16a9a9780c7520fd2366e2125b17bb8e968d7f.png";

import BitcoinCashImage from "../assets/images/icon.png";

const tokenIdImageMap: { [tokenId: string]: any } = {
  "1074bafb678b85f90bca79fa201a26011e09bfc6f723b95c770c0850f8d44fe8": Bitcoin2Image,
  "49be89bbbe018bcfaebcb41cac8340bc555f022b47b922599e510b143603f4b6": SLPTorchTokenImage,
  "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf": SpiceTokenImage,
  "527a337f34e04b1974cb8a1edc7ca30b2e444bea111afc122259552243c1dbe3": LiberlandMeritImage,
  "959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98": ACDCoinImage,
  c4b0d62156b3fa5c8f3436079b5394f7edc1bef5dc1cd2f9d0c4d46f82cca479: HonestCoinImage,
  f35007140e40c4b6ce4ecc9ad166101ad94562b3e4f650a30de10b8a80c0b987: HonkTokenImage,
  "0f3f223902c44dc2bee6d3f77d565904d8501affba5ee0c56f7b32e8080ce14b": DropTokenImage,
  "7853218e23fdabb103b4bccbe6e987da8974c7bc775b7e7e64722292ac53627f": SAITokenImage,
  "3f83fa9f168f01d68933ef5fdb77143b2376ba7bf3a78175258861982d90d500": GOCTokenImage,
  "29d353a3d19cdd7324f1c14b3fe289293976842869fed1bea3f9510558f6f006": LEADTokenImage,
  f66c6d0ac6b8c5c4ed469234ec9734f6d3499b0351b22349f40e617d22254fec: ZBCHTokenImage,
  "7f8889682d57369ed0e32336f8b7e0ffec625a35cca183f4e81fde4e71a538a1": HonkHonkTokenImage,
  eebaa04d0e715b7bd21901cb60e10d7f71d219626daf24c57ce6ea9584333149: MiamiTokenImage,
   "4bad853480dd5c52871ee3c2e779f78c7b43912cca974211d10b50fec9d6f81b": ForkTokenImage,
  "6ef92fa35cf791a6ae26fab62c16a9a9780c7520fd2366e2125b17bb8e968d7f": HamTokenImage
};

let blockieCache: { [tokenId: string]: any } = {};

const getTokenImage = (tokenId?: string | null) => {
  if (!tokenId) {
    return BitcoinCashImage;
  }

  if (tokenIdImageMap[tokenId]) {
    return tokenIdImageMap[tokenId];
  }

  let blockie = blockieCache[tokenId];

  if (!blockie) {
    const newBlockie = makeBlockie(tokenId);
    blockieCache = {
      ...blockieCache,
      [tokenId]: newBlockie
    };
    blockie = newBlockie;
  }

  const imageSource = {
    uri: blockie
  };

  return imageSource;
};

export { tokenIdImageMap, getTokenImage };
