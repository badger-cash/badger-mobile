// @flow

const API = `https://rest.bitcoin.com/v2`;

const getBlockCountURL = `${API}/blockchain/getBlockCount`;

const getCurrentBlockheight = async () => {
  try {
    console.log("about to try");
    const req = await fetch(getBlockCountURL);
    const resp = req.json();
    console.log("resp?");
    console.log(resp);
    return resp;
  } catch (e) {
    console.warn(e);
    throw e;
  }
};

export { getCurrentBlockheight };
