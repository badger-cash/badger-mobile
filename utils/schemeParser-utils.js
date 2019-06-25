// @flow

const SLPSDK = require("slp-sdk");
const SLP = new SLPSDK();

const BITBOX = require("bitbox-sdk").BITBOX;
const bitbox = new BITBOX();

const tokenIdRegex = /^([A-Fa-f0-9]{2}){32,32}$/;

const parse = (scheme: string) => {
  let type = getType(scheme);

  if (type === "cashaddr") {
    return parseBCH(scheme);
  } else if (type === "slpaddr") {
    return parseSLP(scheme);
  }
};

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

const parseBCH = (scheme: string) => {
  let address = scheme.split("?")[0];
  let amount, label, message;

  try {
    checkIsValid("cashaddr", address);
  } catch (error) {
    throw new Error("invalid address");
  }
  address = bitbox.Address.toCashAddress(address);
  amount = getValue(scheme, "amount");

  amount = parseAmount(amount);

  label = getValue(scheme, "label");

  message = getValue(scheme, "message");
  message = message !== undefined ? message.replace(/%20/g, " ") : undefined;

  let obj = { address, amount, label, message };
  obj = removeEmpty(obj);

  return obj;
};

const parseSLP = (scheme: string) => {
  let address = scheme.split("?")[0];
  let amount, label, tokenId, tokenAmount;

  try {
    checkIsValid("slpaddr", address);
  } catch (error) {
    throw new Error("invalid address");
  }
  address = SLP.Address.toSLPAddress(address);

  amount = getValue(scheme, "amount");
  amount = parseAmount(amount);

  label = getValue(scheme, "label");
  tokenAmount = getTokenValue(scheme);
  tokenAmount = parseAmount(tokenAmount);

  tokenId = getTokenId(scheme);

  let obj = { address, amount, tokenAmount, label, tokenId };
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
  parse,
  parseAddress,
  parseBCH,
  parseSLP,
  getValue,
  getTokenId,
  getTokenValue,
  parseAmount,
  getType,
  checkIsValid,
  removeEmpty
};
