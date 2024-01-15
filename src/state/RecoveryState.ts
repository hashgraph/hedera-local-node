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
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { IS_WINDOWS } from '../constants';

/**
 * Represents the recovery state of the Hedera Local Node.
 * @implements {IState}
 * @property {LoggerService} logger - The logger service.
 * @property {IOBserver | undefined} observer - The observer of the state.
 * @property {string} stateName - The name of the state.
 * @property {EventType} eventType - The event type that triggered the recovery state.
 */
export class RecoveryState implements IState{
    /**
     * The logger service used for logging messages.
     */
    private logger: LoggerService;
    
    /**
     * The observer for the recovery state.
     */
    private observer: IOBserver | undefined;

    /**
     * The name of the state.
     */
    private stateName: string;

    /**
     * The type of event associated with the recovery state.
     */
    private eventType: EventType;
    
    /**
     * Creates a new instance of the RecoveryState class.
     * @param {EventType} eventType - The type of event.
     */
    constructor(eventType: EventType) {
        this.stateName = RecoveryState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Recovery State Initialized!', this.stateName);
        this.eventType = eventType;
    }

    /**
     * Subscribes an observer to receive updates from the RecoveryState.
     * @param {IOBserver} observer - The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the recovery state.
     * @returns {Promise<void>} A promise that resolves when the recovery state has started.
     */
    public async onStart(): Promise<void> {
        this.logger.info("Starting Recovery State...", this.stateName);

        switch (this.eventType) {
            case EventType.DockerError:
                await this.tryDockerRecovery();
            default:
                this.observer?.update(EventType.UnknownError);
                break;
        }
    }

    /**
     * Tries to recover the state by performing Docker recovery steps.
     * Stops the docker containers, cleans volumes and temp files, and tries to startup again.
     * @returns {Promise<void>} A promise that resolves when the recovery steps have completed.
     */
    private async tryDockerRecovery(): Promise<void> {
        const nullOutput = this.getNullOutput();
        this.logger.trace('Stopping the docker containers...', this.stateName);
        shell.exec(`docker compose kill --remove-orphans 2>${nullOutput}`);
        shell.exec(`docker compose down -v --remove-orphans 2>${nullOutput}`);
        this.logger.trace('Cleaning the volumes and temp files...', this.stateName);
        shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
        shell.exec(`docker network prune -f 2>${nullOutput}`);
        this.logger.info('Trying to startup again...', this.stateName);
    }

    /**
     * Returns the appropriate output path for null based on the operating system.
     * On Windows, it returns 'null'. On other operating systems, it returns '/dev/null'.
     * 
     * @returns {string} The output path for null.
     */
    private getNullOutput (): string {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }
}
