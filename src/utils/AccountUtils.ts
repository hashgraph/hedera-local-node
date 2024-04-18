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

import { AccountId, AccountInfo, AccountInfoQuery, Client, Hbar, TransferTransaction } from '@hashgraph/sdk';

/**
 * Provides utility methods for working with accounts.
 */
export class AccountUtils {

  /**
   * Creates an account with the given properties.
   * @param aliasAccountId The alias ID of the account to create.
   * @param initialBalance The initial balance of the account.
   * @param client The client to use for creating the account.
   */
  public static async createAccount(aliasAccountId: AccountId,
                                    initialBalance: number,
                                    client: Client): Promise<AccountInfo> {
    const hbarAmount = new Hbar(initialBalance);

    const response = await new TransferTransaction()
      .addHbarTransfer(client.operatorAccountId!, hbarAmount.negated())
      .addHbarTransfer(aliasAccountId, hbarAmount)
      .execute(client);
    await response.getReceipt(client);

    return new AccountInfoQuery()
      .setAccountId(aliasAccountId)
      .execute(client);
  }
}
