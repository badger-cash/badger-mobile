// Helper methods to communicate with the Post Office REST API

const API = `https://pay.badger.cash`;

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

export { postageEndpoint, getPostageRates };
