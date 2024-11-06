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

import shell from 'shelljs';
import { LocalNodeErrors } from '../Errors/LocalNodeErrors';
import { START_STATE_INIT_MESSAGE, START_STATE_STARTED_DETECTING, START_STATE_STARTED_MESSAGE, START_STATE_STARTING_MESSAGE } from '../constants';
import { IOBserver } from '../controller/IObserver';
import { CLIService } from '../services/CLIService';
import { ConnectionService } from '../services/ConnectionService';
import { DockerService } from '../services/DockerService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { EventType } from '../types/EventType';
import { IState } from './IState';

export class StartState implements IState{
    /**
     * The logger service used for logging messages.
     */
    private logger: LoggerService;

    /**
     * The connection service used for establishing and managing connections.
     */
    private connectionService: ConnectionService;

    /**
     * Represents the Docker service used by the StartState class.
     */
    private dockerService: DockerService;

    /**
     * The observer for the StartState.
     */
    private observer: IOBserver | undefined;

    /**
     * The CLI options for the StartState class.
     */
    private cliOptions: CLIOptions;

    /**
     * The name of the state.
     */
    private stateName: string;
    
    /**
     * Creates an instance of StartState.
     * 
     * @constructor
     */
    constructor() {
        this.stateName = StartState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.connectionService = ServiceLocator.Current.get<ConnectionService>(ConnectionService.name);
        this.logger.trace(START_STATE_INIT_MESSAGE, this.stateName);
    }

    /**
     * Subscribes an observer to the state.
     * 
     * @public
     * @param {IOBserver} observer - The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the Hedera Local Node.
     * 
     * @public
     * @returns {Promise<void>} A Promise that resolves when the Hedera Local Node is successfully started.
     */
    public async onStart(): Promise<void> {
        this.logger.info(START_STATE_STARTING_MESSAGE, this.stateName);

        const rootPath = process.cwd();

        shell.cd(__dirname);
        shell.cd('../../');
        const output = await this.dockerService.dockerComposeUp(this.cliOptions);
        
        if (output.code === 1) {
            this.observer?.update(EventType.DockerError);
            await this.dockerService.dockerComposeUp(this.cliOptions);
        }
        shell.cd(rootPath);
        this.logger.info(START_STATE_STARTED_DETECTING, this.stateName);

        try {
            await this.connectionService.waitForFiringUp(5600, 'Mirror Node GRPC');
            await this.connectionService.waitForFiringUp(50211, 'Network Node');
        } catch (e: any) {
            if (e instanceof LocalNodeErrors) {
                this.logger.error(e.message, this.stateName);
            }
            this.observer!.update(EventType.UnknownError);
            return;
        }

        this.logger.info(START_STATE_STARTED_MESSAGE, this.stateName);
        this.observer?.update(EventType.Finish);
    }
}
