import BigNumber from "bignumber.js";
import {
  toSlpAddress,
  toCashAddress,
  isCashAddress,
  isSlpAddress
} from "bchaddrjs-slp";

import { TokenData } from "../data/tokens/reducer";

const parseAddress = (address: string) => {
  let type = getType(address);

  if (type === "cashaddr") {
    try {
      checkIsValid("cashaddr", address);
    } catch (error) {
      throw new Error("invalid address");
    }

    return toCashAddress(address);
  } else if (type === "slpaddr") {
    try {
      checkIsValid("slpaddr", address);
    } catch (error) {
      throw new Error("invalid address");
    }

    return toSlpAddress(address);
  }
  return address;
};

const parseSLP = (
  params: {
    label?: string;
    amount1?: string;
    amount?: string;
    amount2?: string;
    address?: string;
  },
  tokensById: { [tokenId: string]: TokenData }
): {
  address?: string;
  amount?: string;
  tokenAmount?: string | null;
  label?: string;
  symbol?: string;
  tokenId?: string;
} => {
  let amount, tokenId, tokenAmount;

  const { label, amount1, amount2 } = params;

  if (amount1 !== undefined) {
    tokenAmount = amount1.split("-")[0];
    tokenId = amount1.split("-")[1];
  }

  if (amount2 !== undefined) {
    tokenAmount = amount2.split("-")[0];
    tokenId = amount2.split("-")[1];
  }

  if (params.amount !== undefined) {
    amount = params.amount[0];
    tokenAmount = params.amount[1].split(":")[0];
    tokenId = params.amount[1].split(":")[1];
  }

  const tokenInBalance = tokenId && tokensById[tokenId];

  let symbol = "---";
  if (tokenInBalance) {
    symbol = tokenInBalance.symbol;
  }

  if (tokenAmount) {
    tokenAmount = parseAmount(tokenAmount);
  }

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

const parseBCHScheme = (
  scheme: string
): {
  address: string | null;
  amount: string | null;
  label: string | null;
  message: string | null;
} => {
  const addressFromScheme = getAddress(scheme);
  try {
    checkIsValid("cashaddr", addressFromScheme);
  } catch (error) {
    throw new Error("invalid address");
  }
  const cashAddress = toCashAddress(addressFromScheme);

  const amount = getValue(scheme, "amount");
  const parsedAmount = parseAmount(amount);

  const label = getValue(scheme, "label");
  const message = getValue(scheme, "message");

  const formattedMessage = message && message.replace(/%20/g, " ");

  let obj = {
    address: cashAddress,
    amount: parsedAmount,
    label,
    message: formattedMessage
  };

  obj = removeEmpty(obj);

  return obj;
};

const getAddress = (scheme: string) => {
  return scheme.split("?")[0];
};

const getValue = (scheme: string, key: string) => {
  if (!scheme) {
    return null;
  }
  const valueSplit = scheme.split(`${key}=`);

  if (valueSplit.length <= 1) {
    return null;
  }

  const valueParsed = valueSplit[1]
    ? valueSplit[1].split("&")[0]
    : valueSplit[0];
  return valueParsed;
};

const parseAmount = (value?: string | number | null): string | null => {
  if (value == undefined) {
    return null;
  }

  const asBig = new BigNumber(value);

  if (!asBig.isFinite()) throw new Error("Invalid amount");
  if (asBig.lt(0)) throw new Error("Invalid amount");
  return asBig.toString();
};

const getType = (address: string) => {
  if (isCashAddress(address)) return "cashaddr";
  else if (isSlpAddress(address)) return "slpaddr";
  else throw new Error("Invalid Address");
};

const checkIsValid = (type: string, address: string) => {
  if (type === "cashaddr") {
    return isCashAddress(address);
  } else if (type === "slpaddr") {
    return isSlpAddress(address);
  } else {
    console.warn("error in checkisvalid");
  }
};

const removeEmpty = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

export {
  parseAddress,
  parseSLP,
  parseBCHScheme,
  getAddress,
  getValue,
  parseAmount,
  getType,
  checkIsValid,
  removeEmpty
};
