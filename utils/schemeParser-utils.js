// @flow

const SLPSDK = require("slp-sdk");
const SLP = new SLPSDK();

const BITBOX = require("bitbox-sdk").BITBOX;
const bitbox = new BITBOX();

const parse = (scheme: string) => {
  let type = getType(scheme);

  if (type === "BCH") {
    return parseBCH(scheme);
  } else if (type === "SLP") {
    return parseSLP(scheme);
  }
};

const parseBCH = (scheme: string) => {
  let address = scheme.split("?")[0];
  let amount, label, message;

  try {
    const isValid = checkIsValid("BCH", address);
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
    const isValid = checkIsValid("BCH", address);
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

const getType = (scheme: string) => {
  if (bitbox.Address.isCashAddress(scheme)) {
    return "BCH";
  }
  if (SLP.Address.isSLPAddress(scheme)) {
    return "SLP";
  }
  if (scheme.startsWith("pay.bitcoin.com")) {
    return "BIP70";
  }

  return "invalid";
};

const checkIsValid = (type: string, address: string) => {
  if (type === "BCH") {
    return bitbox.Address.isCashAddress(address);
  } else if (type === "SLP") {
    return SLP.Address.isSLPAddress(address);
  }
};

const removeEmpty = (obj: object) => {
  return JSON.parse(JSON.stringify(obj));
};

export {
  parse,
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
