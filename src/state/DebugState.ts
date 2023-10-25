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

import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class DebugState implements IState{
    private logger: LoggerService;
    
    private observer: IOBserver | undefined;

    private stateName: string;
    
    constructor() {
        this.stateName = DebugState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Debug State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}
