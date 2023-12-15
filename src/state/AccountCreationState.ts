/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

export class AccountCreationState implements IState{
    private logger: LoggerService;

    private cliService: CLIService;

    private clientService: ClientService;

    private observer: IOBserver | undefined;

    private stateName: string;

    private nodeStartup: boolean;

    private blacklistedAccountsCount: number = 0;
    
    constructor() {
        this.stateName = AccountCreationState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.clientService = ServiceLocator.Current.get<ClientService>(ClientService.name);
        this.nodeStartup = true;
        this.logger.trace('Account Creaton State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        const currentArgv = this.cliService.getCurrentArgv();
        const async = currentArgv.async;
        this.blacklistedAccountsCount = await this.getBlacklistedAccountsCount();
        const mode = async ? `asynchronous` : `synchronous`
        const blackListedMessage = this.blacklistedAccountsCount > 0 ? `with ${this.blacklistedAccountsCount} blacklisted accounts` : ''
        this.logger.info(
            `Starting Account Creation state in ${mode} mode ${blackListedMessage}`, this.stateName
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

    private async generateAsync(balance: number, accountNum: number) {
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

    private async generateECDSA(async: boolean, balance: number, accountNum: number) {
        let ecdsaAccountNumCounter = 1002 + this.blacklistedAccountsCount;
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

    private async generateAliasECDSA(async: boolean, balance: number, accountNum: number) {
        let aliasedAccountNumCounter = 1012 + this.blacklistedAccountsCount;
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

    private async generateED25519(async: boolean, balance: number, accountNum: number) {
        let edAccountNumCounter = 1022 + this.blacklistedAccountsCount;
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

    private blockListFileName(): string {
        return local.nodeConfiguration.properties
            .find((prop) => prop.key === 'accounts.blocklist.path')?.value as string
    }

    private async getBlacklistedAccountsCount (): Promise<number> {
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

    private logAccount (accountId: string, balance: Hbar, privateKey: string) {
        this.logger.info(`| ${accountId} - ${privateKey} - ${balance} |`, this.stateName);
    }

    private logAliasAccount (accountId: string, balance: number, wallet: ethers.Wallet) {
        this.logger.info(
            `| ${accountId} - ${wallet.address} - ${
            wallet.signingKey.privateKey
            } - ${new Hbar(balance)} |`,
            this.stateName
        );
    }

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

    private logAccountDivider () {
        this.logger.info(
            '|-----------------------------------------------------------------------------------------|',
            this.stateName
        );
    }

    private logAliasAccountDivider () {
        this.logger.info(
            '|--------------------------------------------------------------------------------------------------------------------------------------|',
            this.stateName
        );
    }
}
