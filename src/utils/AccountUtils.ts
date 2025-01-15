// SPDX-License-Identifier: Apache-2.0


import {
  AccountCreateTransaction,
  AccountId,
  AccountInfo,
  AccountInfoQuery,
  Client,
  Hbar,
  PrivateKey,
  PublicKey,
  TransferTransaction
} from '@hashgraph/sdk';
import { IAccountProps } from '../configuration/types/IAccountProps';
import { getPrivateKey, KeyType } from '../configuration/types/IPrivateKey';

/**
 * Provides utility methods for working with accounts.
 */
export class AccountUtils {

  /**
   * Creates an account with the given properties.
   * @param account The account properties.
   * @param client The client to use for creating the account.
   * @returns {Promise<{privateKey: PrivateKey, accountInfo: AccountInfo}>}
   * The private key and account info of the created account.
   */
  public static async createAccountFromProps(account: IAccountProps,
                                             client: Client): Promise<{privateKey: PrivateKey, accountInfo: AccountInfo}> {
    const keyType = account.privateKey ? account.privateKey.type : KeyType.ECDSA;
    const privateKey = account.privateKey ? getPrivateKey(account.privateKey) : PrivateKey.generateECDSA();

    let accountInfo: AccountInfo;
    if (keyType === KeyType.ED25519) {
      accountInfo = await this.createAccount(privateKey.publicKey, account.balance, client);
    } else {
      const accountId = privateKey.publicKey.toAccountId(0, 0);
      accountInfo = await this.createAliasedAccount(accountId, account.balance, client);
    }

    return { accountInfo, privateKey };
  }

  /**
   * Creates an account with the given properties.
   * @param aliasAccountId The alias ID of the account to create.
   * @param initialBalance The initial balance of the account.
   * @param client The client to use for creating the account.
   * @returns {AccountInfo} The account info of the created account.
   */
  public static async createAliasedAccount(aliasAccountId: AccountId,
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

  /**
   * Creates an account with the given properties.
   * @param publicKey The public key of the account to create.
   * @param initialBalance The initial balance of the account.
   * @param client The client to use for creating the account.
   * @returns {AccountInfo} The account info of the created account.
   */
  public static async createAccount(publicKey: PublicKey,
                                    initialBalance: number,
                                    client: Client): Promise<AccountInfo> {
    const response = await new AccountCreateTransaction()
      .setKey(publicKey)
      .setInitialBalance(new Hbar(initialBalance))
      .execute(client);
    const receipt = await response.getReceipt(client);

    return new AccountInfoQuery()
      .setAccountId(receipt.accountId!)
      .execute(client);
  }
}
