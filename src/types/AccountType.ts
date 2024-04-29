/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
