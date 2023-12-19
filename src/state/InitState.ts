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
import { readFileSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import fs from 'fs';
import yaml from 'js-yaml';
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
import { NECESSARY_PORTS, OPTIONAL_PORTS } from '../constants';

configDotenv({ path: path.resolve(__dirname, '../../.env') });

export class InitState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    private dockerService: DockerService;

    private stateName: string;
    
    constructor() {
        this.stateName = InitState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace('Initialization State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        this.logger.trace('Initialization State Starting...', this.stateName);
        const configurationData = new ConfigurationData().getSelectedConfigurationData(this.cliOptions.network);
        this.logger.info("Making sure that Docker is started and it's correct version...", this.stateName);
        // Check if docker is running and it's the correct version
        const isCorrectDockerComposeVersion = await this.dockerService.isCorrectDockerComposeVersion();
        const isDockerStarted = await this.dockerService.checkDocker();
        if (!(isCorrectDockerComposeVersion && isDockerStarted)) {
            this.observer!.update(EventType.UnresolvableError);
            return;
        }
        await this.dockerService.isPortInUse(NECESSARY_PORTS.concat(OPTIONAL_PORTS));

        this.logger.info(`Setting configuration for ${this.cliOptions.network} network with latest images on host ${this.cliOptions.host} with dev mode turned ${this.cliOptions.devMode ? 'on' : 'off'} using ${this.cliOptions.fullMode? 'full': 'turbo'} mode in ${this.cliOptions.multiNode? 'multi' : 'single'} node configuration...`, this.stateName);
        this.prepareWorkingDirectory();
        const workingDirConfiguration = [
            { key: "NETWORK_NODE_LOGS_ROOT_PATH", value: join(this.cliOptions.workingDir, "network-logs", "node") },
            { key: "APPLICATION_CONFIG_PATH", value: join(this.cliOptions.workingDir, "compose-network","network-node","data","config") },
        ];
        configurationData.envConfiguration = configurationData.envConfiguration?.concat(workingDirConfiguration);
        
        this.configureEnvVariables(configurationData.imageTagConfiguration, configurationData.envConfiguration);
        this.configureNodeProperties(configurationData.nodeConfiguration?.properties);
        this.configureMirrorNodeProperties();

        this.observer!.update(EventType.Finish);
    }

   private prepareWorkingDirectory() {
        this.logger.info(`Local Node Working directory set to ${this.cliOptions.workingDir}`,this.stateName);
       this.ensureDirectoryExists(this.cliOptions.workingDir);
       this.ensureDirectoryExists(join(this.cliOptions.workingDir, "network-logs","node"));
       const configDir = join(__dirname, '../../compose-network/network-node/data/config/');
       const configDirMirrorNode = join(__dirname, '../../compose-network/mirror-node/application.yml');
       const configFiles = {
           [configDir]: `${this.cliOptions.workingDir}/compose-network/network-node/data/config`,
           [configDirMirrorNode]: `${this.cliOptions.workingDir}/compose-network/mirror-node/application.yml`
       }
       this.copyDirectories(configFiles);
        // throw new Error('Method not implemented.');
    }


   private ensureDirectoryExists(dirPath: string): void {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            this.logger.trace(`Directory created: ${dirPath}`,this.stateName);

        } else {
            this.logger.trace(`Directory already exists: ${dirPath}`,this.stateName);
        }
    }

    private copyDirectories(directories: { [source: string]: string }): void {
        Object.entries(directories).forEach(([srcDir, destDir]) => {
            if (fs.existsSync(srcDir)) {
                if(fs.lstatSync(srcDir).isDirectory()){
            this.ensureDirectoryExists(destDir);    
            const entries = fs.readdirSync(srcDir, { withFileTypes: true });
            
                    for (const entry of entries) {
                        const srcPath = path.join(srcDir, entry.name);
                        const destPath = path.join(destDir, entry.name);
            
                        if (entry.isDirectory()) {
                            this.ensureDirectoryExists(destPath);    

                            // Recursive call with a new object for the subdirectory
                            this.copyDirectories({ [srcPath]: destPath });
                        } else {
                            fs.copyFileSync(srcPath, destPath);
                            this.logger.trace(`Copied file: ${destPath}`,this.stateName);

                        }
                    }
                } else {
                    this.ensureDirectoryExists(path.dirname((destDir)));
                    fs.copyFileSync(srcDir, destDir);
                    }
           }
        });
    }


    private configureEnvVariables(imageTagConfiguration: Array<Configuration>, envConfiguration: Array<Configuration> | undefined): void {
        imageTagConfiguration.forEach(variable => {
            process.env[variable.key] = variable.value;
            this.logger.trace(`Environment variable ${variable.key} will be set to ${variable.value}.`, this.stateName);
        });

        if (!envConfiguration) {
            this.logger.trace('No new environment variables were configured.', this.stateName);
            return;
        }

        envConfiguration!.forEach(variable => {
            process.env[variable.key] = variable.value;
            this.logger.trace(`Environment variable ${variable.key} will be set to ${variable.value}.`, this.stateName);
        });

        const relayLimitsDisabled = !this.cliOptions.limits;
        if (relayLimitsDisabled) {
            process.env.RELAY_HBAR_RATE_LIMIT_TINYBAR = '0';
            process.env.RELAY_HBAR_RATE_LIMIT_DURATION = '0';
            process.env.RELAY_RATE_LIMIT_DISABLED = `${relayLimitsDisabled}`;
            this.logger.info('Hedera JSON-RPC Relay rate limits were disabled.', this.stateName);
        }
        this.logger.info('Needed environment variables were set for this configuration.', this.stateName);
    }

    private configureNodeProperties(nodeConfiguration: Array<Configuration> | undefined): void {
        const propertiesFilePath = join(__dirname, '../../compose-network/network-node/data/config/bootstrap.properties');

        let newProperties = '';
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
        });

        if (!nodeConfiguration) {
            this.logger.trace('No additional node configuration needed.', this.stateName);
            return;
        }
        nodeConfiguration!.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
            this.logger.trace(`Bootstrap property ${property.key} will be set to ${property.value}.`, this.stateName);
        });

        writeFileSync(propertiesFilePath, newProperties, { flag: 'w' });

        this.logger.info('Needed bootsrap properties were set for this configuration.', this.stateName);
    }

    // TODO: finish off multi node
    private configureMirrorNodeProperties() {
        this.logger.trace('Configuring required mirror node properties, depending on selected configuration...', this.stateName);
        const turboMode = !this.cliOptions.fullMode;
        const debugMode = this.cliOptions.enableDebug;

        // const multiNode = this.cliOptions.multiNode;

        const propertiesFilePath = join(__dirname, '../../compose-network/mirror-node/application.yml');
        const application = yaml.load(readFileSync(propertiesFilePath).toString()) as any;

        if (turboMode) {
            application.hedera.mirror.importer.dataPath = originalNodeConfiguration.turboNodeProperties.dataPath;
            application.hedera.mirror.importer.downloader.sources = originalNodeConfiguration.turboNodeProperties.sources;
        }

        if (debugMode) {
            application.hedera.mirror.importer.downloader.local = originalNodeConfiguration.local
        }

        // if (multiNode) {
        //     application['hedera']['mirror']['monitor']['nodes'] = originalNodeConfiguration.multiNodeProperties
        // }

        writeFileSync(propertiesFilePath, yaml.dump(application, { lineWidth: 256 }));
        this.logger.info('Needed mirror node properties were set for this configuration.', this.stateName);
    }
}
