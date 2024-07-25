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

import net from 'net';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIService } from './CLIService';
import { Errors } from '../Errors/LocalNodeErrors';
import debounce from '../utils/debounce';

/**
 * ConnectionService is a service class that handles network connections.
 * It implements the IService interface.
 * It uses the 'net' module to create connections and check their status.
 * 
 * @class
 * @public
 */
export class ConnectionService implements IService{
    /**
     * The logger service used for logging.
     * @private
     */
    private logger: LoggerService;

    /**
     * The name of the service.
     * @private
     */
    private serviceName: string;

    /**
     * The CLI service used for command line interface operations.
     * @private
     */
    private cliService: CLIService;

    // Debounced function to print error message at most once every N seconds
    private readonly debouncedErrorLog;

    /**
     * Constructs a new instance of the ConnectionService.
     * Initializes the logger and CLI service, and logs the initialization of the connection service.
     */
    constructor() {
        this.serviceName = ConnectionService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.logger.trace('Connection Service Initialized!', this.serviceName);

        this.debouncedErrorLog = debounce((message: string) => {
            this.logger.info(message, this.serviceName);
        }, 5000);

    }

    /**
     * Waits for the local node to fire up by continuously trying to establish a connection.
     * If the connection is not ready after 100 retries, it throws a CONNECTION_ERROR.
     * 
     * @param {number} port - The port to connect to.
     * @throws CONNECTION_ERROR if the port is not ready after a certain number of retries.
     * @returns {Promise<void>} A promise that resolves when the port is ready for connection.
     * @public
     */
    public async waitForFiringUp(port: number, serviceName: string): Promise<void> {
        const { host } = this.cliService.getCurrentArgv();
        let isReady = false;
        // this means that we wait around 100 seconds, normal consensus node startup takes around 60 seconds
        let retries = 100;
        while (!isReady) {
          net
            .createConnection(port, host)
            .on('data', () => {
              isReady = true;
            })
            .on('error', (err: any) => {
              if (err.code === 'ECONNREFUSED') {
                  this.debouncedErrorLog(`${serviceName} not yet available at: ${host}:${port}. Retrying...`);
              }
              else {
                  this.logger.error(err.message, this.serviceName);
              }
            });

            retries--;
          await new Promise((r) => setTimeout(r, 100));
          if (retries < 0) {
            throw Errors.CONNECTION_ERROR(port);
          }
        }
    }

    /**
     * Checks the connection to the local node.
     * If the connection is not established within a timeout of 3000ms, it rejects the promise with 'timeout'.
     * If the connection is established, it resolves the promise and ends the socket.
     * If there is an error during the connection, it rejects the promise with the error.
     * 
     * @param {number} port - The port to connect to.
     * @public
     * @returns {Promise<void>} - A promise that resolves when the connection is established, and rejects when there is an error or timeout.
     */
    public checkConnection(port: number): Promise<void> {
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
