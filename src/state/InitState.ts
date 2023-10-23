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

import { configDotenv } from 'dotenv';
import { writeFileSync } from 'fs';
import path, { join } from 'path';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { CLIOptions } from '../types/CLIOptions';
import { IOBserver } from '../controller/IObserver';
import { EventType } from '../types/EventType';
import { ConfigurationData } from '../data/ConfigurationData';
import { Configuration } from '../types/NetworkConfiguration';
import originalNodeConfiguration from '../configuration/originalNodeConfiguration.json';
import { DockerService } from '../services/DockerService';

configDotenv({ path: path.resolve(__dirname, '../../.env') });

export class InitState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    private dockerService: DockerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace('Initialization State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        this.logger.trace('Initialization State Starting...');
        const configurationData = new ConfigurationData().getSelectedConfigurationData(this.cliOptions.network);
        this.logger.info("Making sure that Docker is started and it's correct version...");
        // Check if docker is running and it's the correct version
        const isCorrectDockerComposeVersion = await this.dockerService.isCorrectDockerComposeVersion();
        const isDockerStarted = await this.dockerService.checkDocker();

        if (!(isCorrectDockerComposeVersion && isDockerStarted)) {
            this.observer!.update(EventType.Error);
            return;
        }

        this.logger.info(`Setting configuration for ${this.cliOptions.network} network with latest images on host ${this.cliOptions.host} with dev mode turned ${this.cliOptions.devMode ? 'on' : 'off'} using ${this.cliOptions.fullMode? 'full': 'turbo'} mode in ${this.cliOptions.multiNode? 'multi' : 'single'} node configuration...`);

        this.configureEnvVariables(configurationData.envConfiguration);
        this.configureNodeProperties(configurationData.nodeConfiguration?.properties);

        this.observer!.update(EventType.Finish);
    }

    private configureEnvVariables(envConfiguration: Array<Configuration> | undefined): void {
        if (!envConfiguration) {
            this.logger.trace('No new environment variables were configured.');
            return;
        }

        envConfiguration!.forEach(variable => {
            process.env[variable.key] = variable.value;
            this.logger.trace(`Environment variable ${variable.key} will be set to ${variable.value}.`);
        });
        this.logger.info('Needed environment variables were set for this configuration.');
    }

    private configureNodeProperties(nodeConfiguration: Array<Configuration> | undefined): void {
        const propertiesFilePath = join(__dirname, '../../compose-network/network-node/data/config/bootstrap.properties');

        let newProperties = '';
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
        });

        if (!nodeConfiguration) {
            this.logger.trace('No additional node configuration needed.');
            return;
        }
        nodeConfiguration!.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
            this.logger.trace(`Bootstrap property ${property.key} will be set to ${property.value}.`);
        });

        writeFileSync(propertiesFilePath, newProperties, { flag: 'w' });

        this.logger.info('Needed bootsrap properties were set for this configuration.');
    }
}
// this state loads all configurations and files