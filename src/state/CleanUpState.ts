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

export class CleanUpState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    private stateName: string;
    
    constructor() {
        this.stateName = CleanUpState.name;
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Clean Up State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        this.logger.info('Initiating clean up procedure. Trying to revert unneeded changes to files...', this.stateName);
        this.revertNodeProperties();
        this.revertMirrorNodeProperties();
        if (this.observer) {
            this.observer!.update(EventType.Finish);
        }
    }

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
