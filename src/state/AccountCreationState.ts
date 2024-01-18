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
import { ethers } from 'ethers';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import {
    AccountCreateTransaction, AccountId, AccountInfoQuery,
    Hbar, PrivateKey, PublicKey, TransferTransaction, Wallet
} from '@hashgraph/sdk';
import { CLIService } from '../services/CLIService';
import { Account } from '../types/AccountType';
import { ClientService } from '../services/ClientService';
import {
    privateKeysECDSA, privateKeysAliasECDSA, privateKeysED25519
} from '../configuration/accountConfiguration.json';
import { EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH } from '../constants';
import local from '../configuration/local.json';

/**
 * Represents the state of account creation.
 * This class is responsible for initializing the AccountCreationState object.
 * @implements {IState}
 */
export class AccountCreationState implements IState{
    /**
     * The logger used for logging account creation state information.
     */
    private logger: LoggerService;

    /**
     * The CLI service used for account creation.
     */
    private cliService: CLIService;

    /**
     * The client service used for account creation.
     */
    private clientService: ClientService;

    /**
     * The observer for the account creation state.
     */
    private observer: IOBserver | undefined;

    /**
     * The name of the state.
     */
    private stateName: string;

    /**
     * Indicates whether the node is being started up.
     */
    private nodeStartup: boolean;

    /**
     * The count of blocklisted accounts.
     * This is used to offset the account numbers.
     * This is only used when the node is being started up.
     * @private
     * Thre default value is 0.
     */
    private blocklistedAccountsCount: number = 0;
    
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
        this.logger.trace('Account Creaton State Initialized!', this.stateName);
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
        if(blocklisting) {
            this.blocklistedAccountsCount = await this.getBlocklistedAccountsCount();
        }

        const mode = async ? `asynchronous` : `synchronous`
        const blockListedMessage = this.blocklistedAccountsCount > 0 ? `with ${this.blocklistedAccountsCount} blocklisted accounts` : ''
        this.logger.info(
            `Starting Account Creation state in ${mode} mode ${blockListedMessage}`, this.stateName
        );
        
        const balance = currentArgv.balance;
        const accountNum = currentArgv.accounts;
        this.nodeStartup = currentArgv.startup;

        if (async) {
            await this.generateAsync(balance, accountNum);
        } else {
            await this.generateECDSA(async, balance, accountNum);
            await this.generateAliasECDSA(async, balance, accountNum);
            await this.generateED25519(async, balance, accountNum);
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
            this.logAccountTitle(' ECDSA ');
            ecdsaResponses!.forEach((account) => {
                if (account) {
                    this.logAccount(
                        account.accountId,
                        account.balance as Hbar,
                        (account.wallet as ethers.Wallet).signingKey.privateKey
                    );
                }
            });
            this.logAccountDivider();
      
            this.logAliasAccountTitle();
            aliasEcdsaResponses!.forEach((account) => {
                if (account) {
                    this.logAliasAccount(
                        account.accountId,
                        account.balance as number,
                        account.wallet as ethers.Wallet
                    );
                }
            });
            this.logAliasAccountDivider();
      
            this.logAccountTitle('ED25519');
            ed25519Responses!.forEach((account) => {
                if (account) {
                    this.logAccount(
                        account.accountId,
                        account.balance as Hbar,
                        (account.wallet as ethers.Wallet).signingKey.privateKey
                    );
                }
            });
            this.logAccountDivider();
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
     * @returns {Promise<void | Wallet[]>} - A promise that resolves when all the accounts have been created if the mode is asynchronous, otherwise void.
     */
    private async generateECDSA(async: boolean, balance: number, accountNum: number) {
        let ecdsaAccountNumCounter = 1002 + this.blocklistedAccountsCount;
        const accounts = [];
        let privateKey;
        let wallet;
        if (!async) this.logAccountTitle(' ECDSA ');
    
        for (let i = 0; i < accountNum; i++) {
            if (this.nodeStartup) {
                privateKey = PrivateKey.fromStringECDSA(privateKeysECDSA[i]);
                wallet = new Wallet(
                    AccountId.fromString(ecdsaAccountNumCounter.toString()),
                    privateKey
                );
            } else {
                privateKey = PrivateKey.generateECDSA();
                wallet = new Wallet(
                    AccountId.fromString(ecdsaAccountNumCounter.toString()),
                    privateKey
                    );
            }
            if (async) {
                accounts.push(
                    this.createAccountAsync(
                    ecdsaAccountNumCounter++,
                    balance,
                    wallet,
                    privateKey
                    )
                );
                continue;
            }
            await this.createAccount(
                ecdsaAccountNumCounter++,
                balance,
                wallet,
                privateKey
            )
        }
        if (!async) {
          this.logAccountDivider();
        } else {
          return Promise.all(accounts);
        }
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
    private async generateAliasECDSA(async: boolean, balance: number, accountNum: number) {
        let aliasedAccountNumCounter = 1012 + this.blocklistedAccountsCount;
        const accounts = [];
    
        if (!async) this.logAliasAccountTitle();
    
        for (let i = 0; i < accountNum; i++) {
          let wallet = ethers.Wallet.createRandom() as unknown as ethers.Wallet;
          if (this.nodeStartup && privateKeysAliasECDSA[i]) {
            wallet = new ethers.Wallet(privateKeysAliasECDSA[i]);
          }
    
          if (async) {
            accounts.push(
              this.createAliasAccount(
                async,
                aliasedAccountNumCounter++,
                balance,
                wallet
              )
            );
            continue;
          }
          const account = await this.createAliasAccount(
            async,
            aliasedAccountNumCounter++,
            balance,
            wallet
          );
    
          this.logAliasAccount(
            account.accountId,
            account.balance as number,
            account.wallet as ethers.Wallet
          );
        }
        if (async) {
            return Promise.all(accounts);
        }
        this.logAliasAccountDivider();
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
     * @returns {Promise<void | Wallet[]>} - A promise that resolves when all the accounts have been created if the mode is asynchronous, otherwise void.
     */
    private async generateED25519(async: boolean, balance: number, accountNum: number) {
        let edAccountNumCounter = 1022 + this.blocklistedAccountsCount;
        const accounts = [];
        let privateKey;
        let wallet;
        if (!async) this.logAccountTitle('ED25519');
    
        for (let i = 0; i < accountNum; i++) {

            if (this.nodeStartup) {
                privateKey = PrivateKey.fromStringED25519(privateKeysED25519[i]);
                
                wallet = new Wallet(
                    AccountId.fromString(edAccountNumCounter.toString()),
                    privateKey
                );
            } else {
                privateKey = PrivateKey.generateED25519();

                wallet = new Wallet(
                AccountId.fromString(edAccountNumCounter.toString()),
                privateKey
                );
            }
            if (async) {
                accounts.push(
                    this.createAccountAsync(
                    edAccountNumCounter++,
                    balance,
                    wallet,
                    privateKey
                    )
                );
                continue;
            }
            await this.createAccount(
                edAccountNumCounter++,
                balance,
                wallet,
                privateKey
            )
        }
        if (!async) {
          this.logAccountDivider();
        } else {
          return Promise.all(accounts);
        }
    }

    /**
     * Creates an account asynchronously.
     * 
     * This method retrieves the client, creates an account creation transaction with the public key from the wallet and the initial balance, and executes the transaction.
     * It initializes the account ID with a default value.
     * If the node is not in startup mode, it gets the receipt of the transaction and updates the account ID with the ID from the receipt.
     * Finally, it returns an object with the account ID, the wallet, and the balance.
     * 
     * @private
     * @param {number} accountNum - The account number.
     * @param {number} balance - The balance for the account.
     * @param {Wallet} wallet - The wallet for the account.
     * @param {PrivateKey} privateKey - The private key for the account.
     * @returns {Promise<Account>} - A promise that resolves with the created account.
     */
    private async createAccountAsync (accountNum: number, balance: number, wallet: Wallet, privateKey: PrivateKey): Promise<Account> {
        const client = this.clientService.getClient();
        const tx = await new AccountCreateTransaction()
          .setKey(PublicKey.fromString(wallet.publicKey.toStringDer()))
          .setInitialBalance(new Hbar(balance))
          .execute(client);
        let accountId = `0.0.${accountNum}`;

        if (!this.nodeStartup) {
          const getReceipt = await tx.getReceipt(client);
          accountId = getReceipt.accountId!.toString();
        }

        return {
            accountId,
            wallet,
            balance: new Hbar(balance)
        };
    }

    /**
     * Creates an account synchronously.
     * 
     * This method retrieves the client, creates an account creation transaction with the public key from the wallet and the initial balance, and executes the transaction.
     * It initializes the account ID with a default value.
     * If the node is not in startup mode, it gets the receipt of the transaction and updates the account ID with the ID from the receipt.
     * Finally, it logs the account ID, the balance, and the raw string representation of the private key.
     * 
     * @private
     * @param {number} accountNum - The account number.
     * @param {number} balance - The balance for the account.
     * @param {Wallet} wallet - The wallet for the account.
     * @param {PrivateKey} privateKey - The private key for the account.
     * @returns {Promise<void>} - A promise that resolves when the account has been created and logged.
     */
    private async createAccount (accountNum: number, balance: number, wallet: Wallet, privateKey: PrivateKey) {
        const client = this.clientService.getClient();
        const tx = await new AccountCreateTransaction()
          .setKey(PublicKey.fromString(wallet.publicKey.toStringDer()))
          .setInitialBalance(new Hbar(balance))
          .execute(client);
        let accountId = `0.0.${accountNum}`;

        if (!this.nodeStartup) {
          const getReceipt = await tx.getReceipt(client);
          accountId = getReceipt.accountId!.toString();
        }

        this.logAccount(
          accountId,
          new Hbar(balance),
          `0x${privateKey.toStringRaw()}`
        );
    }
    
    /**
     * Creates an alias account.
     * 
     * This method retrieves the client, creates a public key from the compressed public key of the wallet's signing key, and converts it to an account ID.
     * It creates a transfer transaction that transfers the specified balance from the account ID to the account with ID '0.0.2' and executes the transaction.
     * It initializes the account number with a default value.
     * If the node is not in startup mode or the mode is asynchronous, it gets the receipt of the transaction and retrieves the account info for the account with the EVM address of the wallet.
     * It updates the account number with the ID from the account info.
     * Finally, it returns an object with the account ID, the wallet, and the balance.
     * 
     * @private
     * @param {boolean} async - Whether the mode is asynchronous.
     * @param {number} aliasedAccountNumCounter - The alias account number counter.
     * @param {number} balance - The balance for the account.
     * @param {ethers.Wallet} wallet - The wallet for the account.
     * @returns {Promise<Account>} - A promise that resolves with the created alias account.
     */
    private async createAliasAccount (async: boolean, aliasedAccountNumCounter: number, balance: number, wallet: ethers.Wallet): Promise<Account> {
        const client = this.clientService.getClient();
        const accountId = PublicKey.fromString(
          wallet.signingKey.compressedPublicKey.replace('0x', '')
        ).toAccountId(0, 0);
        const transferTransaction = new TransferTransaction()
          .addHbarTransfer(accountId, new Hbar(balance))
          .addHbarTransfer(AccountId.fromString('0.0.2'), new Hbar(-balance));
        const tx = await transferTransaction.execute(client);
        let accountNum = `0.0.${aliasedAccountNumCounter}`;
        if (!this.nodeStartup || async) {
          await tx.getReceipt(client);
    
          const accountInfo = await new AccountInfoQuery({
            accountId: AccountId.fromEvmAddress(0, 0, wallet.address)
          }).execute(client);
          accountNum = accountInfo.accountId.toString();
        }
        return { accountId: accountNum, wallet, balance };
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
            .find((prop) => prop.key === 'accounts.blocklist.path')?.value as string
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
    private async getBlocklistedAccountsCount (): Promise<number> {
        return new Promise((resolve) => {
            let count = 0;
            const filepath = path.join(
                __dirname,
                EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH,
                this.blockListFileName()
            );
            createReadStream(filepath)
                .pipe(csvParser())
                .on('data', (r: string) => {
                    count++;
                })
                .on('end', () => {
                    resolve(count);
                });
        })
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
    private logAccount (accountId: string, balance: Hbar, privateKey: string) {
        this.logger.info(`| ${accountId} - ${privateKey} - ${balance} |`, this.stateName);
    }

    /**
     * Logs an alias account.
     * 
     * This method logs the account ID, the wallet address, the private key of the wallet's signing key, and the balance of an alias account, along with the state name.
     * 
     * @private
     * @param {string} accountId - The account ID.
     * @param {number} balance - The balance of the account.
     * @param {ethers.Wallet} wallet - The wallet of the account.
     */
    private logAliasAccount (accountId: string, balance: number, wallet: ethers.Wallet): void {
        this.logger.info(
            `| ${accountId} - ${wallet.address} - ${
            wallet.signingKey.privateKey
            } - ${new Hbar(balance)} |`,
            this.stateName
        );
    }

    /**
     * Logs the title of an account.
     * 
     * This method logs a divider, the title of the account list with the account type, another divider, the headers for the account ID, private key, and balance, and a final divider.
     * 
     * @private
     * @param {string} accountType - The type of the account.
     */
    private logAccountTitle (accountType: string) {
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
    private logAliasAccountTitle () {
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
    private logAccountDivider () {
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
    private logAliasAccountDivider () {
        this.logger.info(
            '|--------------------------------------------------------------------------------------------------------------------------------------|',
            this.stateName
        );
    }
}
