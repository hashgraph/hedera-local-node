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

import { IOBserver } from '../controller/IObserver';
import { DockerService } from '../services/DockerService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';

export class AttachState implements IState{
    /**
     * The logger service used for logging messages.
     */
    private logger: LoggerService;

    /**
     * Represents the Docker service used by the AttachState class.
     */
    private dockerService: DockerService;
    
    /**
     * The observer for the AttachState.
     */
    private observer: IOBserver | undefined;

    /**
     * The name of the state.
     */
    private stateName: string;
    
    /**
     * Represents the AttachState class.
     * This class is responsible for initializing the AttachState object.
     */
    constructor() {
        this.stateName = AttachState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace('Attach State Initialized!', this.stateName);
    }

    /**
     * Subscribes an observer to receive updates from this AttachState instance.
     * @param {IOBserver} observer The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the state.
     * @public
     * @returns {Promise<void>}
     */
    public async onStart(): Promise<void> {
        this.observer!.update(EventType.Finish);
    }
}
