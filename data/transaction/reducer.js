// @flow

// import { SELECT_TOKEN } from "./constants";

// type Action = { type: string, payload: any };

// // Consider putting selected account here also?
// // Or consider moving this to the account reducer
// export type State = {
//   selectedTokenId: ?string
// };

// export const initialState: State = { selectedTokenId: null };

// const selectToken = (state: State, payload: string) => {
//   return { ...state, selectTokenId: payload };
// };

// const accounts = (state: State = initialState, action: Action): State => {
//   switch (action.type) {
//     case SELECT_TOKEN:
//       return selectToken(state, action.payload);
//     default:
//       return state;
//   }
// };

// export default accounts;


{
//   "txid": "629fb97cbc068bdd4b4fde64a12fa94c32671f93bed14172dc7c6ff451f30b35",
//   "vout": 1,
//   "amount": 0.00000546,
//   "satoshis": 546,
//   "height": 571454,
//   "confirmations": 1053,
//   "tx": {
//     "txid": "629fb97cbc068bdd4b4fde64a12fa94c32671f93bed14172dc7c6ff451f30b35",
//     "version": 1,
//     "locktime": 571453,
//     "vin": [
//       {
//         "txid": "2d61e14d1fd490644717f74442f04ed8ed03da1af56ea4b020382c46c55b8649",
//         "vout": 2,
//         "sequence": 4294967294,
//         "n": 0,
//         "scriptSig": {
//           "hex": "483045022100a4591f611f72c4d27f4dd5a969f56371813c4cea5da19fbcbcb36cb754c0f99202206afdea169c309e818d877edd9bcdc3c13c944393f2d803b9c812e70415adc53141210382bac9c51722be9c3374551a0c460dd6331efcd966306566ee11db8d196fdc2c",
//           "asm": "3045022100a4591f611f72c4d27f4dd5a969f56371813c4cea5da19fbcbcb36cb754c0f99202206afdea169c309e818d877edd9bcdc3c13c944393f2d803b9c812e70415adc531[ALL|FORKID] 0382bac9c51722be9c3374551a0c460dd6331efcd966306566ee11db8d196fdc2c"
//         },
//         "value": 546,
//         "legacyAddress": "1E9nooKPQXSc12EEpe7bPNuZoMztMPEemJ",
//         "cashAddress": "bitcoincash:qzgyxv6k8xzd3e7ldevlnhqz9u6hqzj96y46w092k8"
//       },
//       {
//         "txid": "2d61e14d1fd490644717f74442f04ed8ed03da1af56ea4b020382c46c55b8649",
//         "vout": 3,
//         "sequence": 4294967294,
//         "n": 1,
//         "scriptSig": {
//           "hex": "473044022023faa62a9905afc877fa16f6d70995edfca8cf6c218e05d81d90aae27ee8727e0220135ba1d6de19c68cc433ff838da90a9043fa78740b22834c1f18fc4c9746752341210382bac9c51722be9c3374551a0c460dd6331efcd966306566ee11db8d196fdc2c",
//           "asm": "3044022023faa62a9905afc877fa16f6d70995edfca8cf6c218e05d81d90aae27ee8727e0220135ba1d6de19c68cc433ff838da90a9043fa78740b22834c1f18fc4c97467523[ALL|FORKID] 0382bac9c51722be9c3374551a0c460dd6331efcd966306566ee11db8d196fdc2c"
//         },
//         "value": 666229,
//         "legacyAddress": "1E9nooKPQXSc12EEpe7bPNuZoMztMPEemJ",
//         "cashAddress": "bitcoincash:qzgyxv6k8xzd3e7ldevlnhqz9u6hqzj96y46w092k8"
//       }
//     ],
//     "vout": [
//       {
//         "value": "0.00000000",
//         "n": 0,
//         "scriptPubKey": {
//           "hex": "6a04534c500001010453454e44204de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf0800006d23ad5f8000080114067fe84b4000",
//           "asm": "OP_RETURN 5262419 1 1145980243 4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf 00006d23ad5f8000 0114067fe84b4000"
//         },
//         "spentTxId": null,
//         "spentIndex": null,
//         "spentHeight": null
//       },
//       {
//         "value": "0.00000546",
//         "n": 1,
//         "scriptPubKey": {
//           "hex": "76a914340c497a37ed9009aeb5dac493ea029aa775364288ac",
//           "asm": "OP_DUP OP_HASH160 340c497a37ed9009aeb5dac493ea029aa7753642 OP_EQUALVERIFY OP_CHECKSIG",
//           "addresses": [
//             "15kCrhAALMLMUzXUU5XCZxLjc9tALnwvNT"
//           ],
//           "type": "pubkeyhash"
//         },
//         "spentTxId": null,
//         "spentIndex": null,
//         "spentHeight": null
//       },
//       {
//         "value": "0.00000546",
//         "n": 2,
//         "scriptPubKey": {
//           "hex": "76a91460795bf76cb15a8aeb6c128adb7dad9eb07d552d88ac",
//           "asm": "OP_DUP OP_HASH160 60795bf76cb15a8aeb6c128adb7dad9eb07d552d OP_EQUALVERIFY OP_CHECKSIG",
//           "addresses": [
//             "19o7Fc2HUYjYDbV3d6rZLQ7t9s7Mk5quM7"
//           ],
//           "type": "pubkeyhash"
//         },
//         "spentTxId": "55a7ce3b05dc524972211a766e78340b5632821d6cef6ad7c7332d7d3335ddea",
//         "spentIndex": 0,
//         "spentHeight": 572488
//       },
//       {
//         "value": "0.00665202",
//         "n": 3,
//         "scriptPubKey": {
//           "hex": "76a91460795bf76cb15a8aeb6c128adb7dad9eb07d552d88ac",
//           "asm": "OP_DUP OP_HASH160 60795bf76cb15a8aeb6c128adb7dad9eb07d552d OP_EQUALVERIFY OP_CHECKSIG",
//           "addresses": [
//             "19o7Fc2HUYjYDbV3d6rZLQ7t9s7Mk5quM7"
//           ],
//           "type": "pubkeyhash"
//         },
//         "spentTxId": "55a7ce3b05dc524972211a766e78340b5632821d6cef6ad7c7332d7d3335ddea",
//         "spentIndex": 1,
//         "spentHeight": 572488
//       }
//     ],
//     "blockhash": "0000000000000000012084edb464caa136f2b5a86440515cf00366b53b72cb06",
//     "blockheight": 571454,
//     "confirmations": 1053,
//     "time": 1551198032,
//     "blocktime": 1551198032,
//     "valueOut": 0.00666294,
//     "size": 480,
//     "valueIn": 0.00666775,
//     "fees": 0.00000481
//   },
//   "slp": {
//     "token": "4de69e374a8ed21cbddd47f2338cc0f479dc58daa2bbe11cd604ca488eca0ddf",
//     "quantity": "120000000000000",
//     "baton": false
//   },
//   "spendable": false,
//   "validSlpTx": true
// },