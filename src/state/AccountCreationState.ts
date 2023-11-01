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
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { Hbar } from '@hashgraph/sdk';
import { CLIService } from '../services/CLIService';

export class AccountCreationState implements IState{
    private logger: LoggerService;

    private cliService: CLIService;

    private observer: IOBserver | undefined;

    private stateName: string;

    private nodeStartup: boolean;
    
    constructor() {
        this.stateName = AccountCreationState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.nodeStartup = true;
        this.logger.trace('Account Creaton State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        const currentArgv = this.cliService.getCurrentArgv();
        const async = currentArgv.async;
        this.logger.info(`Starting Account Creation state in ${async ? `asynchronous` : `synchronous`} mode...`, this.stateName);

        const balance = currentArgv.balance;
        const accountNum = currentArgv.accounts;
        this.nodeStartup = currentArgv.startup;

        if (async) {
            await this.generateAsync(balance, accountNum);
        } else {
            await this.generateSync(balance, accountNum);
        }

        this.observer!.update(EventType.Finish);
    }

    private async generateAsync(balance: number, accountNum: number) {

    }

    private async generateSync(balance: number, accountNum: number) {
        
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
