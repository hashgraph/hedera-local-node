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

import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import { join } from 'path';
import { IOBserver } from '../controller/IObserver';
import originalNodeConfiguration from '../configuration/originalNodeConfiguration.json';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { CLIOptions } from '../types/CLIOptions';
import { EventType } from '../types/EventType';

/**
 * The `CleanUpState` class is responsible for cleaning up and reverting unneeded changes to files.
 * 
 * It implements the `IState` interface and provides methods to subscribe an observer, start the cleanup process, and revert properties of the mirror node and the consensus node.
 * 
 * @class
 * @implements {IState}
 */
export class CleanUpState implements IState{
    /**
     * The logger service used for logging messages.
     */
    private logger: LoggerService;

    /**
     * The observer for the CleanUpState.
     */
    private observer: IOBserver | undefined;

    /**
     * The CLI options for the initialization state.
     */
    private cliOptions: CLIOptions;

    /**
     * The name of the state.
     */
    private stateName: string;
    
    /**
     * Initializes a new instance of the CleanUpState class.
     */
    constructor() {
        this.stateName = CleanUpState.name;
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Clean Up State Initialized!', this.stateName);
    }

    /**
     * Subscribes an observer to the `CleanUpState`.
     * 
     * @param {IObserver} observer - The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the cleanup process.
     * 
     * This method initiates the cleanup procedure, tries to revert unneeded changes to files, and updates the observer when the cleanup is finished.
     * 
     * @returns {Promise<void>}
     */
    public async onStart(): Promise<void> {
        this.logger.info('Initiating clean up procedure. Trying to revert unneeded changes to files...', this.stateName);
        this.revertNodeProperties();
        this.revertMirrorNodeProperties();
        if (this.observer) {
            this.observer!.update(EventType.Finish);
        }
    }

    /**
     * Reverts the properties of the mirror node.
     * 
     * This method cleans up unneeded mirror node properties and writes the updated properties back to the file.
     * @private
     */
    private revertMirrorNodeProperties() {
        this.logger.trace('Clean up unneeded mirror node properties...', this.stateName);
        const propertiesFilePath = join(this.cliOptions.workDir, 'compose-network/mirror-node/application.yml');
        if (!existsSync(propertiesFilePath)) {
            this.logger.trace(`Mirror Node Properties File doesn't exist at path ${propertiesFilePath}`,this.stateName);
            return;
        }
        const application = yaml.load(readFileSync(propertiesFilePath).toString()) as any;
        delete application.hedera.mirror.importer.dataPath;
        delete application.hedera.mirror.importer.downloader.sources;
        delete application.hedera.mirror.importer.downloader.local

        application.hedera.mirror.monitor.nodes = originalNodeConfiguration.fullNodeProperties;
        writeFileSync(propertiesFilePath, yaml.dump(application, { lineWidth: 256 }));
        this.logger.info('Clean up of mirror node properties finished.', this.stateName);
    }

    /**
     * Reverts the properties of the consensus node.
     * 
     * This method cleans up unneeded bootstrap properties and writes the original properties back to the file.
     * 
     * @private
     */
    private revertNodeProperties(): void {
        this.logger.trace('Clean up unneeded bootstrap properties.', this.stateName);
        const propertiesFilePath = join(this.cliOptions.workDir, 'compose-network/network-node/data/config/bootstrap.properties');
        if (!existsSync(propertiesFilePath)) {
            this.logger.trace(`Node Properties File doesn't exist at path ${propertiesFilePath}`,this.stateName);
            return;
        }
        let originalProperties = '';
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            originalProperties = originalProperties.concat(`${property.key}=${property.value}\n`);
        });

        writeFileSync(propertiesFilePath, originalProperties, { flag: 'w' });

        this.logger.info('Clean up of consensus node properties finished.', this.stateName);
    }
}
