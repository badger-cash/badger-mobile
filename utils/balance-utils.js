// @flow

import { type BigNumber } from "bignumber.js";

const getHistoricalBchTransactions = async (address: string) => {
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
            }
          ],
          "out.h1": {
            $ne: "534c5000"
          }
        },
        $orderby: {
          "blk.i": -1
        }
      },
      limit: 50
    }
  };
  const s = JSON.stringify(query);
  const b64 = Buffer.from(s).toString("base64");
  const url = `https://bitdb.bitcoin.com/q/${b64}`;
  const request = await fetch(url);
  const result = await request.json();

  let transactions = [];
  if (result && result.c) {
    transactions = transactions.concat(result.c);
  }
  if (result.data && result.data.u) {
    transactions = transactions.concat(result.u);
  }

  return transactions;
};

const formatAmount = (amount: ?BigNumber, decimals: ?number): string => {
  if (decimals == null) {
    return "-.--------";
  }
  if (!amount) {
    return `-.`.padEnd(decimals + 2, "-");
  }

  const adjustDecimals = amount
    .dividedBy(Math.pow(10, decimals))
    .toFixed(decimals);
  // const removeTrailing = +adjustDecimals + "";

  return adjustDecimals.toString();
};

export { getHistoricalBchTransactions, formatAmount };
