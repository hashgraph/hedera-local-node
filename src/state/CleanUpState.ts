import { writeFileSync } from 'fs';
import { join } from 'path';
import { IOBserver } from '../controller/IObserver';
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

import originalNodeConfiguration from '../configuration/originalNodeConfiguration.json';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { EventType } from '../types/EventType';

export class CleanUpState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Clean Up State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        this.logger.info('Initiating clean up procedure. Trying to revert unneeded changes to files...');
        this.revertNodeProperties();
        
        if (this.observer) {
            this.observer!.update(EventType.Finish);
        }
    }

    private revertNodeProperties(): void {
        this.logger.trace('Clean up unneeded bootstrap properties.');
        const propertiesFilePath = join(__dirname, '../../compose-network/network-node/data/config/bootstrap.properties');

        let originalProperties = '';
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            originalProperties = originalProperties.concat(`${property.key}=${property.value}\n`);
        });

        writeFileSync(propertiesFilePath, originalProperties, { flag: 'w' });

        this.logger.info('Clean up finished.');
    }
}
// this state attempts to stop the network and return to original state