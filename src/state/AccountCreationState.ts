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
    privateKeysED25519,
} from '../configuration/accountConfiguration.json';
import {
    ACCOUNT_CREATION_STATE_INIT_MESSAGE,
    CHECK_SUCCESS,
    EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH,
    LOADING,
    SDK_ERRORS,
} from '../constants';
import local from '../configuration/local.json';
import { AccountUtils } from '../utils/AccountUtils';
import { RetryUtils } from '../utils/RetryUtils';

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
        this.logger.trace(ACCOUNT_CREATION_STATE_INIT_MESSAGE, this.stateName);
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
        const { async, blocklisting, accounts, balance, startup } = this.cliService.getCurrentArgv();
        this.nodeStartup = startup;

        let blocklistedAccountsCount = 0;
        if (blocklisting) {
            blocklistedAccountsCount = await this.getBlocklistedAccountsCount();
        }

        const mode = async ? 'asynchronous' : 'synchronous';
        const blockListedMessage = blocklisting ? `with ${blocklistedAccountsCount} blocklisted accounts` : '';
        this.logger.info(
            `${LOADING} Starting Account Creation state in ${mode} mode ${blockListedMessage}...`, this.stateName
        );

        const promise = this.generateAccounts(balance, accounts);
        if (!async) {
            await promise;
        }
        this.logger.info(`${CHECK_SUCCESS} Accounts created succefully!`, this.stateName);
        this.observer!.update(EventType.Finish);
    }

    /**
     * Generates accounts.
     *
     * This method generates ECDSA, alias ECDSA, and ED25519 accounts.
     *
     * @private
     * @param {number} balance - The balance for the accounts.
     * @param {number} accounts - The number of accounts to generate.
     * @returns {Promise<void>} - A promise that resolves when the accounts have been generated.
     */
    private async generateAccounts(balance: number, accounts: number): Promise<void> {
        await Promise.all([
            this.generateECDSA(balance, accounts),
            this.generateAliasECDSA(balance, accounts),
            this.generateED25519(balance, accounts)
        ]);
    }

    /**
     * Generates ECDSA accounts.
     *
     * If the node is in startup mode:
     * - it uses the private keys from the ECDSA private keys array to create the account.
     * - otherwise, it generates new ECDSA private keys.
     *
     * @private
     * @param {number} balance - The balance for the accounts.
     * @param {number} limit - The number of accounts to generate.
     * @returns {Promise<Account[]>} - A promise that resolves when all the accounts have been created.
     */
    private async generateECDSA(balance: number, limit: number): Promise<Account[]> {
        const accountData = this.nodeStartup ?
            privateKeysECDSA.map(privateKeyString => ({
                balance,
                privateKey: PrivateKey.fromStringECDSA(privateKeyString)
            })) :
            Array.from({ length: limit }, () => ({
                balance,
                privateKey: PrivateKey.generateECDSA()
            }));

        const endIndex = Math.min(accountData.length, limit);

        return this.createAccounts('ECDSA', accountData.slice(0, endIndex));
    }

    /**
     * Generates alias ECDSA accounts.
     *
     * If the node is in startup mode and the private key for the alias ECDSA account exists:
     * - it uses the private key to create the account.
     * - otherwise, it generates new ECDSA private keys.
     *
     * If the mode is asynchronous:
     * - it creates the alias accounts asynchronously and returns a promise that resolves when they have been created,
     * - otherwise, it creates the alias accounts synchronously and returns them in a resolved promise.
     *
     * @private
     * @param {number} balance - The balance for the accounts.
     * @param {number} accountNum - The number of accounts to generate.
     * @returns {Promise<Account[]>} - A promise that resolves when all the alias accounts have been created
     */
    private async generateAliasECDSA(balance: number, accountNum: number): Promise<Account[]> {
        const accountData = this.nodeStartup ?
            privateKeysAliasECDSA.map(privateKeyString => ({
                balance,
                privateKey: PrivateKey.fromStringECDSA(privateKeyString)
            })) :
            Array.from({ length: accountNum }, () => ({
                balance,
                privateKey: PrivateKey.generateECDSA()
            }));

        const endIndex = Math.min(accountData.length, accountNum);

        return this.createAliasAccounts(accountData.slice(0, endIndex));
    }

    /**
     * Generates ED25519 accounts.
     *
     * If the node is in startup mode:
     * - it uses the private keys from the ED25519 private keys array to create the account.
     * - otherwise, it generates new ED25519 private keys.
     *
     * @param balance - The balance for the accounts.
     * @param limit - The number of accounts to generate.
     * @returns {Promise<Account[]>} - A promise that resolves when all the
     * accounts have been created if the mode is asynchronous, otherwise void.
     * @private
     */
    private async generateED25519(balance: number, limit: number): Promise<Account[]> {
        const accountData = this.nodeStartup ?
            privateKeysED25519.map(privateKeyString => ({
                balance,
                privateKey: PrivateKey.fromStringED25519(privateKeyString)
            })) :
            Array.from({ length: limit }, () => ({
                balance,
                privateKey: PrivateKey.generateED25519()
            }));

        const endIndex = Math.min(accountData.length, limit);

        return this.createAccounts('ED25519', accountData.slice(0, endIndex));
    }

    /**
     * Generates ED25519 accounts.
     *
     * @private
     * @param {string} title - The title to be logged for the account list.
     * @param {Array<{ balance: number, privateKey: PrivateKey}>} accountData - The data for the accounts that will be created.
     * @param {number} accountData.balance - The balance of the account to create.
     * @param {PrivateKey} accountData.privateKey - The private key of the account to create.
     * @returns {Promise<Account[]>} - A promise that resolves when all the accounts have been created.
     */
    private async createAccounts(title: string, accountData: {
        balance: number,
        privateKey: PrivateKey
    }[]): Promise<Account[]> {
        const accountPromises: Promise<Account>[] = [];

        accountData.forEach((account) => {
            const { privateKey, balance } = account;
            const client = this.clientService.getClient();
            const publicKey = privateKey.publicKey;

            const createAccountPromise: Promise<Account> = RetryUtils.retryTask(
                () => AccountUtils.createAccount(publicKey, balance, client),
                {
                    shouldRetry: error => this.shouldRetry(error),
                    doOnRetry: error => this.doOnRetry(error)
                }).then((accountInfo) => {
                    const address = accountInfo.accountId.toSolidityAddress();
                    return {
                        accountId: accountInfo.accountId.toString(),
                        balance: accountInfo.balance,
                        privateKey,
                        address
                    };
                });

            accountPromises.push(createAccountPromise);
        });

        return Promise.all(accountPromises)
            .then((accounts) => {
                if (accounts) {
                    this.logAccountTitle(title);
                    accounts.forEach((account) => this.logAccount(
                        account.accountId,
                        account.balance,
                        `0x${account.privateKey.toStringRaw()}`
                    ));
                    this.logAccountDivider();
                }
                return accounts;
            });
    }

    /**
     * Creates alias accounts.
     *
     * @param accountData - The data for the accounts that will be created.
     * @param accountData.balance - The balance of the account to create.
     * @param accountData.privateKey - The private key of the account to create.
     * @returns {Promise<Account[]>} - A promise that resolves when all the alias accounts have been created
     * @private
     */
    private async createAliasAccounts(accountData: { balance: number, privateKey: PrivateKey }[]): Promise<Account[]> {
        const accountPromises: Promise<Account>[] = [];

        // eslint-disable-next-line no-plusplus
        accountData.forEach(account => {
            const { privateKey, balance } = account;
            const client = this.clientService.getClient();
            const aliasAccountId = privateKey.publicKey.toAccountId(0, 0);

            const createAccountPromise: Promise<Account> = RetryUtils.retryTask(
                () => AccountUtils.createAliasedAccount(aliasAccountId, balance, client),
                {
                    shouldRetry: error => this.shouldRetry(error),
                    doOnRetry: error => this.doOnRetry(error)
                }).then((accountInfo) => {
                    const address = privateKey.publicKey.toEvmAddress();
                    return {
                        accountId: accountInfo.accountId.toString(),
                        balance: accountInfo.balance,
                        privateKey,
                        address
                    };
                });

            accountPromises.push(createAccountPromise);
        });

        return Promise.all(accountPromises)
            .then((accounts) => {
                if (accounts) {
                    this.logAliasAccountTitle();
                    accounts.forEach((account) => this.logAliasAccount(
                        account.accountId,
                        account.balance,
                        `0x${account.address}`,
                        `0x${account.privateKey.toStringRaw()}`
                    ));
                    this.logAliasAccountDivider();
                }
                return accounts;
            });
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

    private shouldRetry = (error: unknown): boolean => {
        return error?.toString().includes(SDK_ERRORS.FAILED_TO_FIND_A_HEALTHY_NODE) ?? false;
    }

    private doOnRetry = (error: unknown): void => {
        this.logger.warn(`Error occurred during task execution: "${error?.toString()}"`, this.stateName);
    }
}
