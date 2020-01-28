// Helper methods to communicate with the REST API
// Prefer this over using BitBox when possible.

const API = `https://rest.bitcoin.com/v2`;

const getBlockCountURL = `${API}/blockchain/getBlockCount`;

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

export { getCurrentBlockheight };
