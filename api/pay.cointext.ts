// Helper methods to communicate with the PostOffice REST API
// Prefer this over using BitBox when possible.

const API = `https://pay.cointext.io`;

const postageEndpoint = `${API}/postage`;

const getPostageRates = async () => {
  try {
    const req = await fetch(postageEndpoint);
    const resp = await req.json();
    return resp;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

export { getPostageRates };
