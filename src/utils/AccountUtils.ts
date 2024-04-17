/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { AccountInfo, AccountInfoQuery, Client, Hbar, PrivateKey, TransferTransaction } from '@hashgraph/sdk';
import { IAccountProps } from '../configuration/types/IAccountProps';

/**
 * Provides utility methods for working with accounts.
 */
export class AccountUtils {

  /**
   * Creates an account with the given properties.
   * @param account The properties of the account to create.
   * @param client The client to use for creating the account.
   */
  public static async createAccount(account: IAccountProps, client: Client): Promise<[string, AccountInfo]> {
    const privateKey = PrivateKey.fromStringECDSA(account.privateKeyAliasECDSA);
    const aliasAccountId = privateKey.publicKey.toAccountId(0, 0);
    const hbarAmount = new Hbar(account.balance);

    const response = await new TransferTransaction()
      .addHbarTransfer(client.operatorAccountId!, hbarAmount.negated())
      .addHbarTransfer(aliasAccountId, hbarAmount)
      .execute(client);
    await response.getReceipt(client);

    const info = await new AccountInfoQuery()
      .setAccountId(aliasAccountId)
      .execute(client);

    return [account.privateKeyAliasECDSA, info];
  }
}