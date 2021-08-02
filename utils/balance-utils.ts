import BigNumber from "bignumber.js";

import {
  currencyDecimalMap,
  currencySymbolMap,
  CurrencyCode
} from "./currency-utils";

// Minimal interface for what the app needs.

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

export { computeFiatAmount, formatAmount, formatAmountInput, formatFiatAmount };
