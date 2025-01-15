// SPDX-License-Identifier: Apache-2.0

import { Client, FileContentsQuery } from '@hashgraph/sdk';
import shell from 'shelljs';
import { IOBserver } from '../controller/IObserver';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { DockerService } from '../services/DockerService';
import {
    NETWORK_PREP_STATE_IMPORT_FEES_END,
    NETWORK_PREP_STATE_IMPORT_FEES_START,
    NETWORK_PREP_STATE_INIT_MESSAGE,
    NETWORK_PREP_STATE_STARTING_MESSAGE,
    NETWORK_PREP_STATE_TOPIC_CREATED,
    NETWORK_PREP_STATE_WAITING_TOPIC_CREATION
  } from '../constants';

/**
 * Represents the network preparation state of the Hedera Local Node.
 * @implements {IState}
 */
export class NetworkPrepState implements IState {
    /**
     * The logger service used for logging messages.
     */
    private logger: LoggerService;

    /**
     * The client service used in the network preparation state.
     */
    private clientService: ClientService;

    /**
     * Represents the Docker service used for network preparation.
     */
    private dockerService: DockerService;

    /**
     * The observer for the network preparation state.
     */
    private observer: IOBserver | undefined;

    /**
     * The name of the state.
     */
    private stateName: string;
    
    /**
     * Represents the NetworkPrepState class.
     * This class is responsible for initializing the network preparation state.
     */
    constructor() {
        this.stateName = NetworkPrepState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.clientService = ServiceLocator.Current.get<ClientService>(ClientService.name);
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace(NETWORK_PREP_STATE_INIT_MESSAGE, this.stateName);
    }

    /**
     * Subscribes an observer to receive updates from the network preparation state.
     * @param {IOBserver} observer - The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the network preparation process.
     * @returns {Promise<void>} A promise that resolves when the network preparation is complete.
     */
    public async onStart(): Promise<void> {
        this.logger.info(NETWORK_PREP_STATE_STARTING_MESSAGE, this.stateName);
        const client = this.clientService.getClient();

        await this.importFees(client);
        await this.waitForTopicCreation();

        this.observer!.update(EventType.Finish);
    }

    /**
     * Imports fees and exchange rates into the network.
     * @param {Client} client - The Hedera client.
     * @returns {Promise<void>} A promise that resolves when the import is complete.
     */
    private async importFees(client: Client): Promise<void> {
        this.logger.trace(NETWORK_PREP_STATE_IMPORT_FEES_START, this.stateName);

        const feesFileId = 111;
        const exchangeRatesFileId = 112;

        const timestamp = Date.now();
        const nullOutput = this.dockerService.getNullOutput();

        const queryFees = this.buildQueryFees(feesFileId);
        const fees = Buffer.from(await queryFees.execute(client)).toString('hex');
        await shell.exec(
          `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${fees}', 'hex'), ${
            timestamp + '000000'
          }, ${feesFileId}, 17);" >> ${nullOutput}`
        );
    
        const queryExchangeRates = this.buildQueryFees(exchangeRatesFileId);
        const exchangeRates = Buffer.from(await queryExchangeRates.execute(client)).toString('hex');
        await shell.exec(
          `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${exchangeRates}', 'hex'), ${
            timestamp + '000001'
          }, ${exchangeRatesFileId}, 17);" >> ${nullOutput}`
        );

        this.logger.info(NETWORK_PREP_STATE_IMPORT_FEES_END, this.stateName);
    }

    /**
     * Builds a query for the fees file.
     * @param {number} feesFileId - The fees file ID.
     * @returns {FileContentsQuery} The query for the fees file.
     */
    private buildQueryFees(feesFileId: number): FileContentsQuery {
        return new FileContentsQuery().setFileId(
            `0.0.${feesFileId}`
        )
    }

    /**
     * Mirror Node Monitor creates a Topic Entity. 
     * If that happens during the account generation step all consecutive AccountIds 
     * get shifted by 1 and the private keys no longer correspond to the expected AccountIds.
     *  @returns {Promise<void>}
     */
    private async waitForTopicCreation(): Promise<void> {
        this.logger.trace(NETWORK_PREP_STATE_WAITING_TOPIC_CREATION, this.stateName);
        const LOG_SEARCH_TEXT = 'Created TOPIC entity';

        return new Promise((resolve, reject) => {
          const command = shell.exec('docker logs mirror-node-monitor -f', {
            silent: true,
            async: true
          });
          command.stdout!.on('data', (data) => {
            if (data.indexOf(LOG_SEARCH_TEXT) !== -1) {
              command.kill('SIGINT');
              command.stdout!.destroy();
              this.logger.info(NETWORK_PREP_STATE_TOPIC_CREATED, this.stateName);
              resolve();
            }
          });
        });
    }
}
// this state waits for topics and uploads fees