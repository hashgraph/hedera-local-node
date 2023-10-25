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
import { IS_WINDOWS } from '../constants';
import { IOBserver } from '../controller/IObserver';
import { CLIService } from '../services/CLIService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { EventType } from '../types/EventType';
import { IState } from './IState';

export class StartState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    private stateName: string;
    
    constructor() {
        this.stateName = StartState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
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
            // TODO: add fallback
        }
        shell.cd(rootPath);
        
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
                  `docker compose -f ${composeFiles.join(' -f ')} up -d 2>${this.getNullOutput()}`
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

    private getNullOutput () {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }
}
