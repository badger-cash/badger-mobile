import BigNumber from "bignumber.js";

import {
  currencyDecimalMap,
  currencySymbolMap,
  CurrencyCode
} from "./currency-utils";

import { SLP } from "./slp-sdk-utils";
import { getSlpTransactions } from "../api/rest.bitcoin";

// Minimal interface for what the app needs.
// Reference the BitDB docs to access fields not listed here.
export interface ResultBitDB {
  blk?: { i?: number; t: number };
  tx: { h: string };
  in: { e: { a: string } }[];
  out: { e: { a: string; v: number } }[];
}

export interface ResultSlpDB extends ResultBitDB {
  slp: {
    detail: {
      outputs: { address: string; amount: string }[];
      tokenIdHex: string;
      transactionType: string;
      decimals: number;
    };
  };
}

const getHistoricalBchTransactions = async (
  address: string,
  addressSlp: string,
  latestBlock: number
): Promise<ResultBitDB[]> => {
  if (!address) {
    return [] as ResultBitDB[];
  }

  const query = {
    v: 3,
    q: {
      find: {
        $query: {
          $or: [
            {
              "in.e.a": address.slice(12)
            },
            {
              "out.e.a": address.slice(12)
            },
            {
              "in.e.a": addressSlp.slice(12)
            },
            {
              "out.e.a": addressSlp.slice(12)
            }
          ],
          "out.h1": {
            $ne: "534c5000"
          },
          "blk.i": {
            $not: {
              $lte: latestBlock
            }
          }
        },
        $orderby: {
          "blk.i": -1
        }
      },
      project: {
        _id: 0,
        "tx.h": 1,
        "in.i": 1,
        "in.e": 1,
        "out.i": 1,
        "out.e": 1,
        blk: 1
      },
      limit: 30
    }
  };

  // combine confirmed and unconfirmed
  // errors = slpdb, error = REST rate limit
  try {
    const result = await SLP.BitDB.get(query);
    let transactions: ResultBitDB[] = [];

    if (result.c) {
      transactions = [...transactions, ...result.c];
    }

    if (result.u) {
      transactions = [...transactions, ...result.u];
    }

    return transactions;
  } catch (e) {
    console.warn("Error while fetching from bitdb");
    console.warn(e);
    return [];
  }
};

const getHistoricalSlpTransactions = async (
  address: string,
  addressSlp: string,
  latestBlock: number
): Promise<ResultSlpDB[]> => {
  if (!address || !addressSlp) {
    return [] as ResultSlpDB[];
  }

  let transactions: ResultSlpDB[] = [];

  try {
    // combine confirmed and unconfirmed
    // errors = slpdb, error = REST rate limit
    const result = await getSlpTransactions(address, addressSlp, latestBlock);

    return result;
  } catch (e) {
    console.warn("Error while fetching from slpdb");
    console.warn(e);
  }

  return transactions;
};

const removeTrailingChars = (word: string, target: string): string => {
  if (word.slice(-1) === target) {
    return removeTrailingChars(word.slice(0, -1), target);
  }

  return word;
};

const formatAmount = (
  amount: BigNumber | null | undefined,

  decimals: number | null | undefined,
  trimEnd?: boolean
): string => {
  if (decimals == null) {
    return "-.--------";
  }

  if (!amount) {
    return `-.`.padEnd(decimals + 2, "-");
  }

  let adjustDecimals = amount.shiftedBy(-1 * decimals).toFormat(decimals);

  if (trimEnd) {
    adjustDecimals = removeTrailingChars(adjustDecimals, "0");

    if (adjustDecimals.slice(-1) === ".") {
      adjustDecimals = adjustDecimals.slice(0, -1);
    }
  }

  return adjustDecimals;
};

const computeFiatAmount = (
  coinAmount: BigNumber,
  spotPrices: any,
  fiatCurrency: CurrencyCode,
  coin: string
): BigNumber | null => {
  const coinSpotPrice = spotPrices[coin];

  if (!coinSpotPrice) {
    return null;
  }
  const spotPrice = coinSpotPrice[fiatCurrency];
  if (!spotPrice) {
    return null;
  }
  const rate = spotPrice.rate;
  let amount = new BigNumber(0);

  if (coin === "bch") {
    const balance = coinAmount.shiftedBy(-1 * 8);
    amount = balance.times(rate);
  }

  return amount;
};

const formatFiatAmount = (
  amount: BigNumber | null | undefined,
  fiatCurrency: CurrencyCode,
  coin: string
) => {
  return amount && !amount.isNaN()
    ? `${currencySymbolMap[fiatCurrency]} ${amount.toFormat(
        currencyDecimalMap[fiatCurrency]
      )} ${fiatCurrency}`
    : `${currencySymbolMap[fiatCurrency]} -.-- ${fiatCurrency}`;
};

const formatAmountInput = (
  amount: string,
  maxDecimals: number | null
): string => {
  if (maxDecimals == null) {
    return "";
  }
  const amountEnglish = amount.replace(",", ".");

  // Filter non-valid characters
  const validCharacters = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  // Max one decimal
  let decimalCount = 0;
  const valid = amountEnglish.split("").reduce((prev, curr, idx, array) => {
    // Add a 0 if first digit is a '.'
    if (idx === 1 && curr === "0" && array[0] === "0") return prev;
    if (validCharacters.includes(curr)) return [...prev, curr];

    if (curr === "." && decimalCount === 0) {
      decimalCount++;
      return [...prev, curr];
    }

    return prev;
  }, [] as string[]);

  // Restrict decimals
  const maybeZero = valid[0] && valid[0] === "." ? ["0", ...valid] : valid;
  const decimalIndex = maybeZero.indexOf(".");
  const decimalAdjusted =
    decimalIndex >= 0
      ? maybeZero.slice(0, decimalIndex + maxDecimals + 1)
      : maybeZero;

  return decimalAdjusted.join("");
};

export {
  computeFiatAmount,
  getHistoricalBchTransactions,
  getHistoricalSlpTransactions,
  formatAmount,
  formatAmountInput,
  formatFiatAmount
};
