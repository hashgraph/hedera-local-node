// SPDX-License-Identifier: Apache-2.0

import { Hbar, PrivateKey } from '@hashgraph/sdk';

/**
 * Represents an account in the Hedera network.
 * 
 * @interface
 * @public
 * @property {string} accountId - The ID of the account.
 * @property {Hbar | number} balance - The balance of the account. It can be an instance of Hbar or a number.
 * @property {PrivateKey} privateKey - The private key of the account.
 * @property {string} address - The address of the account.
 */
export interface Account {
    accountId: string,
    balance: Hbar,
    privateKey: PrivateKey,
    address: string
}
