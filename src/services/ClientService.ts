// SPDX-License-Identifier: Apache-2.0

import { Client } from '@hashgraph/sdk';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIService } from './CLIService';
import { Errors } from '../Errors/LocalNodeErrors';

/**
 * Represents a service for managing the Hedera client.
 * @implements {IService}
 */
export class ClientService implements IService{
    /**
     * The logger service.
     * @private
     */
    private logger: LoggerService;

    /**
     * The CLI service.
     * @private
     */
    private cliService: CLIService;

    /**
     * The name of the service.
     * @private
     */
    private serviceName: string;

    /**
     * The client.
     * @private
     */
    private client: Client | undefined;

    /**
     * Create a client service instance.
     */
    constructor() {
        this.serviceName = ClientService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.logger.trace('Client Service Initialized!', this.serviceName);
    }

    /**
     * Sets up the client for communication with the network.
     * @throws {LocalNodeErrors} If the environment variables OPERATOR_ID and OPERATOR_KEY are not set.
     * @private
     */
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

    /**
     * Retrieves the client instance.
     * If the client instance does not exist, it will be set up.
     * @returns {Client} The client.
     * @public
     */
    public getClient(): Client {
        if (!this.client) {
            this.setupClient();
        }
        return this.client as Client;
    }
}
