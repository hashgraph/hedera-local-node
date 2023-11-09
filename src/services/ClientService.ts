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

import { Client } from '@hashgraph/sdk';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIService } from './CLIService';
import { Errors } from '../Errors/LocalNodeErrors';

export class ClientService implements IService{
    private logger: LoggerService;

    private cliService: CLIService;

    private serviceName: string;

    private client: Client | undefined;

    constructor() {
        this.serviceName = ClientService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.logger.trace('Client Service Initialized!', this.serviceName);
    }

    private setupClient(): void {
        if (process.env.RELAY_OPERATOR_ID_MAIN == null || process.env.RELAY_OPERATOR_KEY_MAIN == null) {
            throw Errors.CLEINT_ERROR("Environment variables OPERATOR_ID, and OPERATOR_KEY are required.")
        }
        const { host } = this.cliService.getCurrentArgv();
        this.client = Client.forNetwork({
            [`${host}:50211`]: '0.0.3'
          })
          .setOperator(
            process.env.RELAY_OPERATOR_ID_MAIN,
            process.env.RELAY_OPERATOR_KEY_MAIN
        );
    }

    public getClient(): Client {
        if (!this.client) {
            this.setupClient();
        }
        return this.client as Client;
    }
}
