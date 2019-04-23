// @flow

import BigNumber from "bignumber.js";

const getHistoricalBchTransactions = async (
  address: string,
  latestBlock: number
) => {
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
      limit: 20
    }
  };
  const s = JSON.stringify(query);
  const b64 = Buffer.from(s).toString("base64");
  const url = `https://bitdb.bitcoin.com/q/${b64}`;

  const request = await fetch(url);
  const result = await request.json();

  const transactions = [...result.c, ...result.u];

  return transactions;
};

const formatAmount = (
  amount: ?BigNumber | ?number,
  decimals: ?number
): string => {
  if (decimals == null) {
    return "-.--------";
  }
  if (!amount) {
    return `-.`.padEnd(decimals + 2, "-");
  }
  let bigNumber = amount;
  console.log(typeof amount);
  if (typeof amount === "number") {
    bigNumber = new BigNumber(amount);
  }

  const adjustDecimals = bigNumber
    .dividedBy(Math.pow(10, decimals))
    .toFixed(decimals);
  // const removeTrailing = +adjustDecimals + "";

  return adjustDecimals.toString();
};

export { getHistoricalBchTransactions, formatAmount };
