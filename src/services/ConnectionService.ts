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

import net from 'net';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIService } from './CLIService';
import { CLIOptions } from '../types/CLIOptions';

export class ConnectionService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    private cliOptions: CLIOptions;

    constructor() {
        this.serviceName = ConnectionService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace('Connection Service Initialized!', this.serviceName);
    }

    public async waitForFiringUp(port: number) {
        const { host } = this.cliOptions;
        let isReady = false;
        while (!isReady) {
          net
            .createConnection(port, host)
            .on('data', () => {
              isReady = true;
            })
            .on('error', (err) => {
              this.logger.trace(
                `Waiting for the containers at ${host}:${port}, retrying in 0.1 seconds...`,
                this.serviceName
              );
              this.logger.error(err.message, this.serviceName);
            });
          await new Promise((r) => setTimeout(r, 100));
        }
    }

    public checkConnection(port: number) {
        const { host } = this.cliOptions;
        return new Promise<void>((resolve, reject) => {
            const timeout = 3000;
            const timer = setTimeout(() => {
              reject('timeout');
              socket.end();
            }, timeout);
            let socket = net.createConnection(port, host, () => {
              clearTimeout(timer);
              resolve();
              socket.end();
            });
            socket.on('error', (err) => {
              clearTimeout(timer);
              reject(err);
            });
        });
    }
}
