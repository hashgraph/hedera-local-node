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

export class RecoveryState implements IState{
    private logger: LoggerService;
    
    private observer: IOBserver | undefined;

    private stateName: string;

    private eventType: EventType;
    
    constructor(eventType: EventType) {
        this.stateName = RecoveryState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Recovery State Initialized!', this.stateName);
        this.eventType = eventType;
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

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

    private async tryDockerRecovery() {
        const nullOutput = this.getNullOutput();
        this.logger.trace('Stopping the docker containers...', this.stateName);
        shell.exec(`docker compose kill --remove-orphans 2>${nullOutput}`);
        shell.exec(`docker compose down -v --remove-orphans 2>${nullOutput}`);
        this.logger.trace('Cleaning the volumes and temp files...', this.stateName);
        shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
        shell.exec(`docker network prune -f 2>${nullOutput}`);
        this.logger.info('Trying to startup again...', this.stateName);
    }

    private getNullOutput () {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }
}
