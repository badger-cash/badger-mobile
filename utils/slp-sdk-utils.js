// @flow

import SLPSDK from "slp-sdk";

const SLP = new SLPSDK({ restURL: "https://badger.bchtest.net/v2/" });

// Uncomment for local version
// const SLP = new SLPSDK({ restURL: "http://localhost:3000/v2/" });

export { SLP };
