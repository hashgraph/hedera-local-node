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
    private logger: LoggerService;

    private connectionService: ConnectionService;

    private dockerService: DockerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    private stateName: string;
    
    constructor() {
        this.stateName = StartState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.connectionService = ServiceLocator.Current.get<ConnectionService>(ConnectionService.name);
        this.logger.trace('Start State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

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

    // TODO: Add multi node option
    private async dockerComposeUp(): Promise<shell.ShellString> {
        const composeFiles = ['docker-compose.yml'];
        const { fullMode } = this.cliOptions;
        const { userCompose } = this.cliOptions;
        const { userComposeDir } = this.cliOptions;

        if (!fullMode) {
            composeFiles.push('docker-compose.evm.yml');
        }

        if (userCompose) {
            composeFiles.push(...this.getUserComposeFiles(userComposeDir));
        }

        return shell.exec(
            `docker compose -f ${composeFiles.join(' -f ')} up -d 2>${this.dockerService.getNullOutput()}`
        );
    }

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
