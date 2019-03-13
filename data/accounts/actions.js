// @flow

import { Mutex } from "await-semaphore";

import {
  ADD_ACCOUNT,
  CREATE_NEW_KEYCHAIN_START,
  CREATE_NEW_KEYCHAIN_SUCCESS,
  CREATE_NEW_KEYCHAIN_FAIL,
  GET_ACCOUNT_START,
  GET_ACCOUNT_SUCCESS,
  GET_ACCOUNT_FAIL
} from "./constants";

import { deriveAccount } from "../../utils/keyring";

const getAccountStart = () => ({
  type: GET_ACCOUNT_START,
  payload: null
});

const getAccountSuccess = () => ({
  type: GET_ACCOUNT_SUCCESS,
  payload: null
});

const getAccountFail = () => ({
  type: GET_ACCOUNT_FAIL,
  payload: null
});

export const getAccount = seed => {
  return async (dispatch: Function, getState: Function) => {
    dispatch(getAccountStart());
    const account = deriveAccount(seed);
    console.log("get account");
    console.log("called");
    console.log(account);
  };
};

// export const addAccount = (account: any) => ({
//   type: ADD_ACCOUNT,
//   payload: account
// });

// const createNewKeychainStart = () => ({
//   type: CREATE_NEW_KEYCHAIN_START,
//   payload: null
// });

// const createNewKeychainSuccess = vault => ({
//   type: CREATE_NEW_KEYCHAIN_SUCCESS,
//   payload: vault
// });

// const createNewKeychainFail = () => ({
//   type: CREATE_NEW_KEYCHAIN_FAIL,
//   payload: null
// });

// const createVaultMutex = new Mutex();

// export const createNewVaultAndKeychain = (password: string, seed: string) => {
//   return async (dispatch: Function, getState: Function) => {
//     dispatch(createNewKeychainStart());

//     const releaseLock = await createVaultMutex.acquire();

//     // TODO:
//     // clear known identities => Do this in the create start action

//     const vault = await keyringController.createNewVaultAndRestore(
//       password,
//       seed
//     );
//     let accounts = await keyringController.getAccounts();

//     console.log('ACCOUNT MADE?')
//     console.log(accounts);

//     let balance = 0;
//     try {
//       balance = await getBalance(accounts[accounts.length - 1]);
//     } catch (err) {
//       balance = 0;
//       console.error("ImportAccount::Error", err);
//       throw err;
//     }

//     const primaryKeyring = keyringController.getKeyringsByType(
//       "HD Key Tree"
//     )[0];

//     if (!primaryKeyring) {
//       throw new Error("KeyringController - No HD Key Tree found");
//     }

//     // seek out the first zero balance
//     // while (parseFloat(balance) !== 0) {
//     //   try {
//     //     await keyringController.addNewAccount(primaryKeyring);
//     //     accounts = await keyringController.getAccounts();
//     //     balance = await getBalance(accounts[accounts.length - 1]);
//     //   } catch (err) {
//     //     console.error("ImportAccount::Error", err);
//     //     balance = 0;
//     //   }
//     // }

//     // TODO - now what?
//     // dispatch(createNewKeychainStart(vault));
//     // dispatch(createNewKeychainFail());
//     releaseLock();

//     // eturn new Promise((resolve, reject) => {
//     //   background.createNewVaultAndKeychain(password, err => {
//     //     if (err) {
//     //       dispatch(actions.displayWarning(err.message))
//     //       return reject(err)
//     //     }

//     //     // log.debug(`background.placeSeedWords`)

//     //     background.placeSeedWords(err => {
//     //       if (err) {
//     //         dispatch(actions.displayWarning(err.message))
//     //         return reject(err)
//     //       }

//     //       resolve()
//     //     })
//     //   })
//     // })
//     //   .then(() => forceUpdateMetamaskState(dispatch))
//     //   .then(() => dispatch(actions.hideLoadingIndication()))
//     //   .catch(() => dispatch(actions.hideLoadingIndication()))
//   };
//   // type: CREATE_NEW_KEYCHAIN,
//   // payload: null
// };

// const getBalance = (address) => {
//   const cache = { balance: 0 } // todo get from state somewhere?
//   if(cache && cache.balance) {
//     return cache.balance
//   }
//   try {
//     const balance = { balance: 1};

//     // todo update and get balance?
//     // const balance = await 'get balance from somewhere else...?'
//     return balance;
//   }
//   catch (err) {
//     console.error(err);
//     throw err;
//   }
// }
// //   return new Promise(async (resolve, reject) => {
// //     const cached = this.accountTracker.store.getState().accounts[address]

// //     if (cached && cached.balance) {
// //       resolve(cached.balance)
// //     } else {
// //       try {
// //         const balance = await this.accountTracker.getBchBalance(address)
// //         resolve(balance)
// //       } catch (err) {
// //         log.error(err)
// //         reject(err)
// //       }
// //     }
// //   })
// // }
