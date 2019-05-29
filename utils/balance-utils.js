// @flow

import BigNumber from "bignumber.js";
import SLPSDK from "slp-sdk";

const SLP = new SLPSDK();

const getHistoricalBchTransactions = async (
  address: string,
  latestBlock: number
) => {
  if (!address) {
    return [];
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

  // combine confirmed and unconfirmed
  const transactions = [...result.c, ...result.u];

  return transactions;
};

const getHistoricalSlpTransactions = async (
  address: string,
  slpAddress: string,
  latestBlock: number
) => {
  if (!address) return [];
  const query = {
    v: 3,
    q: {
      find: {
        db: ["c", "u"],
        $query: {
          $or: [
            {
              "in.e.a": address.slice(12)
            },
            {
              "slp.detail.outputs.address": SLP.Address.toSLPAddress(address)
            },
            {
              "in.e.a": slpAddress.slice(12)
            },
            {
              "slp.detail.outputs.address": SLP.Address.toSLPAddress(slpAddress)
            }
          ],
          "slp.valid": true,
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
        "slp.detail": 1,
        blk: 1
      },
      limit: 500
    }
  };
  const s = JSON.stringify(query);
  const b64 = Buffer.from(s).toString("base64");
  const url = `https://slpdb.bitcoin.com/q/${b64}`;

  const request = await fetch(url);
  const result = await request.json();

  // Get confirmed and unconfirmed transactions
  const transactions = [...result.c, ...result.u];

  return transactions;
};

const formatAmount = (amount: ?BigNumber, decimals: ?number): string => {
  if (decimals == null) {
    return "-.--------";
  }

  if (!amount) {
    return `-.`.padEnd(decimals + 2, "-");
  }

  const adjustDecimals = amount.shiftedBy(-1 * decimals).toFixed(decimals);
  return adjustDecimals;
};

export {
  getHistoricalBchTransactions,
  getHistoricalSlpTransactions,
  formatAmount
};
