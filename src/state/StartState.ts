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
import path from 'path';
import fs from 'fs';
import { IOBserver } from '../controller/IObserver';
import { CLIService } from '../services/CLIService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { ConnectionService } from '../services/ConnectionService';
import { LocalNodeErrors } from '../Errors/LocalNodeErrors';
import { DockerService } from '../services/DockerService';

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
        this.logger.trace('Start State Initialized!', this.stateName);
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
        this.logger.info('Starting Hedera Local Node...', this.stateName);

        const rootPath = process.cwd();

        shell.cd(__dirname);
        shell.cd('../../');
        const output = await this.dockerComposeUp();
        if (output.code === 1) {
            this.observer?.update(EventType.DockerError);
            await this.dockerComposeUp();
        }
        shell.cd(rootPath);
        this.logger.info('Detecting network...', this.stateName);

        try {
            await this.connectionService.waitForFiringUp(5600);
            await this.connectionService.waitForFiringUp(50211);
        } catch (e: any) {
            if (e instanceof LocalNodeErrors) {
                this.logger.error(e.message, this.stateName);
            }
            this.observer!.update(EventType.UnknownError);
            return;
        }

        await this.logger.updateStatusBoard();
        this.logger.info('Hedera Local Node successfully started!', this.stateName);
        this.observer!.update(EventType.Finish);
    }

    /**
     * Executes the docker compose up command.
     * 
     * @private
     * @returns {Promise<shell.ShellString>} A promise that resolves with the output of the command.
     */
    private async dockerComposeUp(): Promise<shell.ShellString> {
        // TODO: Add multi node option
        const composeFiles = ['docker-compose.yml'];
        const { fullMode } = this.cliOptions;
        const { userCompose } = this.cliOptions;
        const { userComposeDir } = this.cliOptions;
        const { multiNode } = this.cliOptions;

        if (!fullMode) {
            composeFiles.push('docker-compose.evm.yml');
        }

        if (multiNode) {
            composeFiles.push('docker-compose.multinode.yml');
        }

        if (!fullMode && multiNode) {
            composeFiles.push('docker-compose.multinode.evm.yml');
        }

        if (userCompose) {
            composeFiles.push(...this.getUserComposeFiles(userComposeDir));
        }

        return shell.exec(
            `docker compose -f ${composeFiles.join(' -f ')} up -d 2>${this.dockerService.getNullOutput()}`
        );
    }

    /**
     *  Retrieves an array of user compose files from the specified directory.
     * 
     * @private
     * @param {string} userComposeDir - The directory path where the user compose files are located. Defaults to './overrides/'.
     * @returns {Array<string>} An array of user compose file paths.
     */
    private getUserComposeFiles(userComposeDir: string = './overrides/'): Array<string> {
        let dirPath = path.normalize(userComposeDir);
        if (!dirPath.endsWith(path.sep)) {
          dirPath += path.sep;
        }
        if (fs.existsSync(dirPath)) {
          const files = fs
            .readdirSync(dirPath)
            .filter((file) => path.extname(file).toLowerCase() === '.yml')
            .sort()
            .map((file) => dirPath.concat(file));
          return files;
        } 
          return [];
    }
}
