// Helper methods to communicate with the REST API
// Prefer this over using BitBox when possible.

const API = `https://rest.bitcoin.com/v2`;

const getBlockCountURL = `${API}/blockchain/getBlockCount`;
const getSlpTransactionsURL = `${API}/slp/transactionHistoryAllTokens`;

const getCurrentBlockheight = async () => {
  try {
    const req = await fetch(getBlockCountURL);
    const resp = await req.json();
    return resp;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

const getSlpTransactions = async (
  address: string,
  addressSlp: string,
  latestBlock = 0
) => {
  const addresses = [address, addressSlp];
  const req = await fetch(getSlpTransactionsURL, {
    method: "post",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      addresses,
      fromBlock: latestBlock
    })
  });

  const resp = await req.json();

  return resp.txs;
};

export { getCurrentBlockheight, getSlpTransactions };
