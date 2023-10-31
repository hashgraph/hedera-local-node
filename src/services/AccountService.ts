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

import { ethers } from 'ethers';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { Hbar } from '@hashgraph/sdk';

export class AccountService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    constructor() {
        this.serviceName = AccountService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Account Service Initialized!', this.serviceName);
    }

    private logAccount (accountId: string, balance: number, privateKey: string) {
    this.logger.info(`| ${accountId} - ${privateKey} - ${balance} |`);
    }

    private logAliasAccount (accountId: string, balance: number, wallet: ethers.Wallet) {
    this.logger.info(
        `| ${accountId} - ${wallet.address} - ${
        wallet.signingKey.privateKey
        } - ${new Hbar(balance)} |`
    );
    }

    private logAccountTitle (accountType: string) {
    this.logAccountDivider();
    this.logger.info(
        `|-----------------------------| Accounts list (${accountType} keys) |----------------------------|`
    );
    this.logAccountDivider();
    this.logger.info(
        '|    id    |                            private key                            |  balance |'
    );
    this.logAccountDivider();
    }

    private logAliasAccountTitle () {
    this.logAliasAccountDivider();
    this.logger.info(
        '|------------------------------------------------| Accounts list (Alias ECDSA keys) |--------------------------------------------------|'
    );
    this.logAliasAccountDivider();
    this.logger.info(
        '|    id    |               public address               |                             private key                            | balance |'
    );
    this.logAliasAccountDivider();
    }

    private logAccountDivider () {
    this.logger.info(
        '|-----------------------------------------------------------------------------------------|'
    );
    }

    private logAliasAccountDivider () {
    this.logger.info(
        '|--------------------------------------------------------------------------------------------------------------------------------------|'
    );
    }
}
