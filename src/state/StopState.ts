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

import shell from 'shelljs';
import { join } from 'path';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { EventType } from '../types/EventType';
import { IS_WINDOWS } from '../constants';
import { CLIOptions } from '../types/CLIOptions';
import { CLIService } from '../services/CLIService';

export class StopState implements IState{
    /**
     * The logger service used for logging.
     */
    private logger: LoggerService;

    /**
     * The observer for the StopState.
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
     * Creates an instance of StopState. 
     * This class is responsible for initializing the StopState object.
     */
    constructor() {
        this.stateName = StopState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace('Stop State Initialized!', this.stateName);
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
     * Starts the stop procedure.
     * Stops the network, docker containers, and cleans up volumes and temporary files.
     * Notifies the observer when the procedure is finished.
     * @returns {Promise<void>} A promise that resolves when the procedure is finished.
     */
    public async onStart(): Promise<void> {
        this.logger.info('Initiating stop procedure. Trying to stop docker containers and clean up volumes...', this.stateName);

        const nullOutput = this.getNullOutput();
        const rootPath = process.cwd();

        this.logger.info('Stopping the network...', this.stateName);
        shell.cd(__dirname);
        shell.cd('../../');
        this.logger.trace('Stopping the docker containers...', this.stateName);
        shell.exec(`docker compose kill --remove-orphans 2>${nullOutput}`);
        shell.exec(`docker compose down -v --remove-orphans 2>${nullOutput}`);
        this.logger.trace('Cleaning the volumes and temp files...', this.stateName);
        shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
        this.logger.trace(`Working dir is ${this.cliOptions.workDir}`, this.stateName);
        shell.exec(`rm -rf "${join(this.cliOptions.workDir, 'network-logs')}" >${nullOutput} 2>&1`);
        shell.exec(`docker network prune -f 2>${nullOutput}`);
        shell.cd(rootPath);
        this.logger.info('Hedera Local Node was stopped successfully.', this.stateName);
        this.observer!.update(EventType.Finish);
    }

    /**
     * Returns the null output path based on the operating system.
     * On Windows, it returns "null".
     * On other operating systems, it returns "/dev/null".
     * @returns {string}
     */
    private getNullOutput (): "null" | "/dev/null" {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }
}
