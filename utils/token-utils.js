// @flow

import makeBlockie from "ethereum-blockies-base64";

import BitcoinCashImage from "../assets/images/icon.png";

import SpiceTokenImage from "../node_modules/bch-token-icons/128/icon/4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf.png";
import HonkTokenImage from "../node_modules/bch-token-icons/128/icon/f35007140e40c4b6ce4ecc9ad166101ad94562b3e4f650a30de10b8a80c0b987.png";
import SLPTorchTokenImage from "../node_modules/bch-token-icons/128/icon/49be89bbbe018bcfaebcb41cac8340bc555f022b47b922599e510b143603f4b6.png";
import WantonTokenImage from "../node_modules/bch-token-icons/128/icon/56ff58fd263736172f0b707c014ea8272d633cc0986b2ffb70e7e209bcc4adad.png";

const tokenIdImageMap = {
  "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf": SpiceTokenImage,
  f35007140e40c4b6ce4ecc9ad166101ad94562b3e4f650a30de10b8a80c0b987: HonkTokenImage,
  "49be89bbbe018bcfaebcb41cac8340bc555f022b47b922599e510b143603f4b6": SLPTorchTokenImage,
  "56ff58fd263736172f0b707c014ea8272d633cc0986b2ffb70e7e209bcc4adad": WantonTokenImage
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
