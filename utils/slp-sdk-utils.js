// @flow

import SLPSDK from "slp-sdk";

const SLP = new SLPSDK();

// Uncomment for local version
// const SLP = new SLPSDK({ restURL: "http://localhost:3000/v2/" });

export { SLP };
