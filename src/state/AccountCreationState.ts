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

import path from 'path';
import { createReadStream } from 'fs';
import csvParser from 'csv-parser';
import { Hbar, PrivateKey } from '@hashgraph/sdk';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { Account } from '../types/AccountType';
import { ClientService } from '../services/ClientService';
import {
  privateKeysAliasECDSA,
  privateKeysECDSA,
  privateKeysED25519
} from '../configuration/accountConfiguration.json';
import { EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH } from '../constants';
import local from '../configuration/local.json';
import { AccountUtils } from '../utils/AccountUtils';

/**
 * Represents the state of account creation.
 * This class is responsible for initializing the AccountCreationState object.
 * @implements {IState}
 */
export class AccountCreationState implements IState {
  /**
   * The name of the state.
   */
  private readonly stateName: string;

  /**
   * The logger used for logging account creation state information.
   */
  private readonly logger: LoggerService;

  /**
   * The CLI service used for account creation.
   */
  private readonly cliService: CLIService;

  /**
   * The client service used for account creation.
   */
  private readonly clientService: ClientService;

  /**
   * The observer for the account creation state.
   */
  private observer: IOBserver | undefined;

  /**
   * Indicates whether the node is being started up.
   */
  private nodeStartup: boolean;

  /**
   * Represents the state of account creation.
   * This class is responsible for initializing the AccountCreationState object.
   */
  constructor() {
    this.stateName = AccountCreationState.name;
    this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
    this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
    this.clientService = ServiceLocator.Current.get<ClientService>(ClientService.name);
    this.nodeStartup = true;
    this.logger.trace('Account Creation State Initialized!', this.stateName);
  }

  /**
   * Subscribes an observer to receive updates from the AccountCreationState.
   * @param {IOBserver} observer The observer to subscribe.
   */
  public subscribe(observer: IOBserver): void {
    this.observer = observer;
  }

  /**
   * Starts the account creation state.
   *
   * This method retrieves the current arguments, checks if blocklisting is enabled, and if so, gets the count of blocklisted accounts.
   * It logs the start of the account creation state, retrieves the balance and number of accounts from the arguments, and sets the node startup.
   * If the mode is asynchronous, it generates accounts asynchronously, otherwise, it generates ECDSA, alias ECDSA, and ED25519 accounts.
   * Finally, it updates the observer with the finish event type.
   *
   * @returns {Promise<void>} A Promise that resolves when the state is started.
   * @emits {EventType.Finish} When the state is finished.
   */
  public async onStart(): Promise<void> {
    const currentArgv = this.cliService.getCurrentArgv();
    const { async, blocklisting } = currentArgv;

    let blocklistedAccountsCount = 0;
    if (blocklisting) {
      blocklistedAccountsCount = await this.getBlocklistedAccountsCount();
    }

    const mode = async ? 'asynchronous' : 'synchronous';
    const blockListedMessage = blocklistedAccountsCount > 0 ? `with ${blocklistedAccountsCount} blocklisted accounts` : '';
    this.logger.info(
      `Starting Account Creation state in ${mode} mode ${blockListedMessage}`, this.stateName
    );

    const { accounts, balance, startup } = currentArgv;
    this.nodeStartup = startup;

    if (async) {
      await this.generateAsync(balance, accounts);
    } else {
      await this.generateECDSA(async, balance, accounts);
      await this.generateAliasECDSA(async, balance, accounts);
      await this.generateED25519(async, balance, accounts);
    }

    this.observer!.update(EventType.Finish);
  }

  /**
   * Generates accounts asynchronously.
   *
   * This method generates ECDSA, alias ECDSA, and ED25519 accounts asynchronously, and logs the accounts.
   *
   * @param {number} balance The balance of the accounts.
   * @param {number} accountNum The number of accounts to generate.
   * @returns {Promise<void>} A Promise that resolves when the accounts are generated.
   */
  private async generateAsync(balance: number, accountNum: number): Promise<void> {
    Promise.all([
      await this.generateECDSA(true, balance, accountNum),
      await this.generateAliasECDSA(true, balance, accountNum),
      await this.generateED25519(true, balance, accountNum)
    ]).then((allResponses) => {
      const ecdsaResponses = allResponses[0];
      const aliasEcdsaResponses = allResponses[1];
      const ed25519Responses = allResponses[2];
      if (ecdsaResponses) {
        this.logAccountTitle(' ECDSA ');
        ecdsaResponses.forEach((account) => {
          if (account) {
            this.logAccount(
              account.accountId,
              account.balance,
              `0x${account.privateKey.toStringRaw()}`
            );
          }
        });
        this.logAccountDivider();
      }

      if (aliasEcdsaResponses) {
        this.logAliasAccountTitle();
        aliasEcdsaResponses.forEach((account) => {
          if (account) {
            this.logAliasAccount(
              account.accountId,
              account.balance,
              account.address,
              `0x${account.privateKey.toStringRaw()}`
            );
          }
        });
        this.logAliasAccountDivider();
      }

      if (ed25519Responses) {
        this.logAccountTitle('ED25519');
        ed25519Responses.forEach((account) => {
          if (account) {
            this.logAccount(
              account.accountId,
              account.balance,
              `0x${account.privateKey.toStringRaw()}`
            );
          }
        });
        this.logAccountDivider();
      }
    });
  }

  /**
   * Generates ECDSA accounts.
   *
   * This method initializes the ECDSA account number counter and an array to hold the accounts.
   * It then generates the specified number of accounts.
   * If the node is in startup mode, it uses the private keys from the ECDSA private keys array to create the wallets, otherwise, it generates new ECDSA private keys.
   * If the mode is asynchronous, it creates the accounts asynchronously and adds them to the accounts array, otherwise, it creates the accounts synchronously.
   * Finally, if the mode is not asynchronous, it logs a divider, otherwise, it returns a promise that resolves when all the accounts have been created.
   *
   * @private
   * @param {boolean} async - Whether the mode is asynchronous.
   * @param {number} balance - The balance for the accounts.
   * @param {number} accountNum - The number of accounts to generate.
   * @returns {Promise<void | Account[]>} - A promise that resolves when all the accounts have been created if the mode is asynchronous, otherwise void.
   */
  private async generateECDSA(async: boolean, balance: number, accountNum: number): Promise<void | Account[]> {
    const accounts: Promise<Account>[] = [];

    if (!async) this.logAccountTitle(' ECDSA ');

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < accountNum; i++) {
      const privateKey = this.nodeStartup ?
        PrivateKey.fromStringECDSA(privateKeysECDSA[i]) :
        PrivateKey.generateECDSA();

      const client = this.clientService.getClient();

      const createAccountPromise: Promise<Account> = AccountUtils
        .createAccount(privateKey.publicKey, balance, client)
        .then((accountInfo) => ({
          accountId: accountInfo.accountId.toString(),
          balance: accountInfo.balance,
          privateKey,
          address: accountInfo.accountId.toSolidityAddress()
        }));

      if (async) {
        accounts.push(createAccountPromise);
      } else {
        // eslint-disable-next-line no-await-in-loop
        const account = await createAccountPromise;
        this.logAccount(
          account.accountId,
          account.balance,
          `0x${privateKey.toStringRaw()}`
        );
      }
    }

    if (async) {
      return Promise.all(accounts);
    }
    this.logAccountDivider();
    return Promise.resolve();
  }

  /**
   * Generates alias ECDSA accounts.
   *
   * This method initializes the alias account number counter and an array to hold the accounts.
   * It then generates the specified number of accounts.
   * If the node is in startup mode and the private key for the alias ECDSA account exists, it uses the private key to create the wallet, otherwise, it creates a random wallet.
   * If the mode is asynchronous, it creates the alias accounts asynchronously and adds them to the accounts array, otherwise, it creates the alias accounts synchronously and logs them.
   * Finally, if the mode is asynchronous, it returns a promise that resolves when all the alias accounts have been created, otherwise, it logs a divider.
   *
   * @private
   * @param {boolean} async - Whether the mode is asynchronous.
   * @param {number} balance - The balance for the accounts.
   * @param {number} accountNum - The number of accounts to generate.
   * @returns {Promise<void | Account[]>} - A promise that resolves when all the alias accounts have been created if the mode is asynchronous, otherwise void.
   */
  private async generateAliasECDSA(async: boolean, balance: number, accountNum: number): Promise<void | Account[]> {
    const accounts: Promise<Account>[] = [];

    if (!async) this.logAliasAccountTitle();

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < accountNum; i++) {
      const privateKey = this.nodeStartup ?
        PrivateKey.fromStringECDSA(privateKeysAliasECDSA[i]) :
        PrivateKey.generateECDSA();

      const aliasAccountId = privateKey.publicKey.toAccountId(0, 0);

      const createAccountPromise: Promise<Account> = AccountUtils
        .createAliasedAccount(aliasAccountId, balance, this.clientService.getClient())
        .then((accountInfo) => ({
          accountId: accountInfo.accountId.toString(),
          balance: accountInfo.balance,
          privateKey,
          address: accountInfo.accountId.toSolidityAddress()
        }));

      if (async) {
        accounts.push(createAccountPromise);
      } else {
        // eslint-disable-next-line no-await-in-loop
        const account = await createAccountPromise;
        this.logAliasAccount(
          account.accountId,
          account.balance,
          account.address,
          `0x${account.privateKey.toStringRaw()}`
        );
      }
    }

    if (async) {
      return Promise.all(accounts);
    }
    this.logAliasAccountDivider();
    return Promise.resolve();
  }

  /**
   * Generates ED25519 accounts.
   *
   * This method initializes the ED25519 account number counter and an array to hold the accounts.
   * It then generates the specified number of accounts.
   * If the node is in startup mode, it uses the private keys from the ED25519 private keys array to create the wallets, otherwise, it generates new ED25519 private keys.
   * If the mode is asynchronous, it creates the accounts asynchronously and adds them to the accounts array, otherwise, it creates the accounts synchronously.
   * Finally, if the mode is not asynchronous, it logs a divider, otherwise, it returns a promise that resolves when all the accounts have been created.
   *
   * @private
   * @param {boolean} async - Whether the mode is asynchronous.
   * @param {number} balance - The balance for the accounts.
   * @param {number} accountNum - The number of accounts to generate.
   * @returns {Promise<void | Account[]>} - A promise that resolves when all the accounts have been created if the mode is asynchronous, otherwise void.
   */
  private async generateED25519(async: boolean, balance: number, accountNum: number): Promise<void | Account[]> {
    const accounts: Promise<Account>[] = [];

    if (!async) this.logAccountTitle('ED25519');

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < accountNum; i++) {
      const privateKey = this.nodeStartup ?
        PrivateKey.fromStringED25519(privateKeysED25519[i]) :
        PrivateKey.generateED25519();
      const client = this.clientService.getClient();

      const createAccountPromise: Promise<Account> = AccountUtils
        .createAccount(privateKey.publicKey, balance, client)
        .then((accountInfo) => ({
          accountId: accountInfo.accountId.toString(),
          balance: accountInfo.balance,
          privateKey,
          address: accountInfo.accountId.toSolidityAddress()
        }));

      if (async) {
        accounts.push(createAccountPromise);
      } else {
        // eslint-disable-next-line no-await-in-loop
        const account = await createAccountPromise;
        this.logAccount(
          account.accountId,
          new Hbar(account.balance),
          `0x${privateKey.toStringRaw()}`
        );
      }
    }

    if (async) {
      return Promise.all(accounts);
    }
    this.logAccountDivider();
    return Promise.resolve();
  }

  /**
   * Retrieves the blocklist file name.
   *
   * This method searches the properties of the node configuration for the property with the key 'accounts.blocklist.path' and returns its value.
   *
   * @private
   * @returns {string} - The blocklist file name.
   */
  private blockListFileName(): string {
    return local.nodeConfiguration.properties
      .find((prop) => prop.key === 'accounts.blocklist.path')?.value as string;
  }

  /**
   * Retrieves the count of blocklisted accounts.
   *
   * This method creates a new promise that resolves with the count of blocklisted accounts.
   * It initializes the count to 0 and constructs the file path to the blocklist file.
   * It creates a read stream from the file, pipes it through a CSV parser, and increments the count for each data event.
   * When the end event is emitted, it resolves the promise with the count.
   *
   * @private
   * @returns {Promise<number>} - A promise that resolves with the count of blocklisted accounts.
   */
  private async getBlocklistedAccountsCount(): Promise<number> {
    return new Promise((resolve) => {
      let count = 0;
      const filepath = path.join(
        __dirname,
        EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH,
        this.blockListFileName()
      );
      createReadStream(filepath)
        .pipe(csvParser())
        .on('data', () => {
          // eslint-disable-next-line no-plusplus
          count++;
        })
        .on('end', () => {
          resolve(count);
        });
    });
  }

  /**
   * Logs an account.
   *
   * This method logs the account ID, the private key, and the balance of an account, along with the state name.
   *
   * @private
   * @param {string} accountId - The account ID.
   * @param {Hbar} balance - The balance of the account.
   * @param {string} privateKey - The private key of the account.
   */
  private logAccount(accountId: string, balance: Hbar, privateKey: string): void {
    this.logger.info(`| ${accountId} - ${privateKey} - ${balance} |`, this.stateName);
  }

  /**
   * Logs an alias account.
   *
   * This method logs the account ID, the account address, the private key of the account, and the balance of an alias account, along with the state name.
   *
   * @private
   * @param {string} accountId - The account ID.
   * @param {number} balance - The balance of the account.
   * @param {string} address - The address of the account.
   * @param {string} privateKey - The private key of the account.
   */
  private logAliasAccount(accountId: string, balance: Hbar, address: string, privateKey: string): void {
    this.logger.info(`| ${accountId} - ${address} - ${privateKey} - ${balance} |`, this.stateName);
  }

  /**
   * Logs the title of an account.
   *
   * This method logs a divider, the title of the account list with the account type, another divider, the headers for the account ID, private key, and balance, and a final divider.
   *
   * @private
   * @param {string} accountType - The type of the account.
   */
  private logAccountTitle(accountType: string) {
    this.logAccountDivider();
    this.logger.info(
      `|-----------------------------| Accounts list (${accountType} keys) |----------------------------|`,
      this.stateName
    );
    this.logAccountDivider();
    this.logger.info(
      '|    id    |                            private key                            |  balance |',
      this.stateName
    );
    this.logAccountDivider();
  }

  /**
   * Logs the title of an alias account.
   *
   * This method logs a divider, the title of the alias account list, another divider, the headers for the account ID, public address, private key, and balance, and a final divider.
   *
   * @private
   */
  private logAliasAccountTitle() {
    this.logAliasAccountDivider();
    this.logger.info(
      '|------------------------------------------------| Accounts list (Alias ECDSA keys) |--------------------------------------------------|',
      this.stateName
    );
    this.logAliasAccountDivider();
    this.logger.info(
      '|    id    |               public address               |                             private key                            | balance |',
      this.stateName
    );
    this.logAliasAccountDivider();
  }

  /**
   * Logs a divider for an account.
   *
   * This method logs a divider line, along with the state name.
   *
   * @private
   */
  private logAccountDivider() {
    this.logger.info(
      '|-----------------------------------------------------------------------------------------|',
      this.stateName
    );
  }

  /**
   * Logs a divider for an alias account.
   *
   * This method logs a divider line, along with the state name.
   *
   * @private
   */
  private logAliasAccountDivider() {
    this.logger.info(
      '|--------------------------------------------------------------------------------------------------------------------------------------|',
      this.stateName
    );
  }
}
