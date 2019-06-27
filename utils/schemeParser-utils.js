// @flow

const SLPSDK = require("slp-sdk");
const SLP = new SLPSDK();

const BITBOX = require("bitbox-sdk").BITBOX;
const bitbox = new BITBOX();

const tokenIdRegex = /^([A-Fa-f0-9]{2}){32,32}$/;

const parseAddress = (address: string) => {
  let type = getType(address);

  if (type === "cashaddr") {
    try {
      checkIsValid("cashaddr", address);
    } catch (error) {
      throw new Error("invalid address");
    }
    return bitbox.Address.toCashAddress(address);
  } else if (type === "slpaddr") {
    try {
      checkIsValid("slpaddr", address);
    } catch (error) {
      throw new Error("invalid address");
    }
    return SLP.Address.toSLPAddress(address);
  }
  return address;
};

const parseSLP = (params: object, tokensById: object) => {
  let amount, symbol, tokenId, tokenAmount;

  const { label, amount1 } = params;

  if (amount1 !== undefined) {
    // slp amount only
    tokenAmount = amount1.split("-")[0];
    tokenId = amount1.split("-")[1];
  } else if (params.amount !== undefined) {
    // slp and bch combined
    amount = params.amount[0];
    tokenAmount = params.amount[1].split(":")[0];
    tokenId = params.amount[1].split(":")[1];
  }
  const tokenInBalance = tokensById[tokenId];
  symbol = tokenInBalance !== undefined ? tokenInBalance.symbol : "N/A";

  let obj = {
    address: params.address,
    amount,
    tokenAmount,
    label,
    symbol,
    tokenId
  };

  obj = removeEmpty(obj);

  return obj;
};

const getValue = (scheme: string, key: string) => {
  let value = scheme.split(`${key}=`);
  if (value.length <= 1) {
    return;
  }

  value = value[1] ? value[1].split("&")[0] : value;
  return value;
};

const getTokenId = (scheme: string) => {
  let value = scheme.split(":");
  value = value[1] ? value[1].split(":")[0] : value;
  if (!tokenIdRegex.test(value)) {
    throw new Error("Token ID is not a valid 32-bye hexideimal string");
  }
  return value;
};

const getTokenValue = (scheme: string) => {
  let value = scheme.split("&amount=");
  value = value[1] ? value[1].split(":")[0] : value;
  return value;
};

const parseAmount = (value: string) => {
  if (value === undefined) {
    return;
  }
  value = Number(value);
  if (!isFinite(value)) throw new Error("Invalid amount");
  if (value < 0) throw new Error("Invalid amount");
  return value;
};

const getType = (address: string) => {
  return SLP.Address.detectAddressFormat(address);
};

const checkIsValid = (type: string, address: string) => {
  if (type === "cashaddr") {
    return bitbox.Address.isCashAddress(address);
  } else if (type === "slpaddr") {
    return SLP.Address.isSLPAddress(address);
  } else {
    console.log("error in checkisvalid");
  }
};

const removeEmpty = (obj: object) => {
  return JSON.parse(JSON.stringify(obj));
};

export {
  parseAddress,
  parseSLP,
  getValue,
  getTokenId,
  getTokenValue,
  parseAmount,
  getType,
  checkIsValid,
  removeEmpty
};
