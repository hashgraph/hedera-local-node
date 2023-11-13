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
import { Errors } from '../Errors/LocalNodeErrors';

export class ConnectionService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    private cliService: CLIService;

    constructor() {
        this.serviceName = ConnectionService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.logger.trace('Connection Service Initialized!', this.serviceName);
    }

    public async waitForFiringUp(port: number) {
        const { host } = this.cliService.getCurrentArgv();
        let isReady = false;
        let retries = 100; // this means that we wait around 100 seconds, normal consensus node startup takes around 60 seconds
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

            retries--;
          await new Promise((r) => setTimeout(r, 100));
          if (retries < 0) {
            throw Errors.CONNECTION_ERROR(port);
          }
        }
    }

    public checkConnection(port: number) {
        const { host } = this.cliService.getCurrentArgv();
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
