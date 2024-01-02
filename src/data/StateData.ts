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

import { AccountCreationState } from '../state/AccountCreationState';
import { CleanUpState } from '../state/CleanUpState';
import { AttachState } from '../state/AttachState';
import { InitState } from '../state/InitState';
import { NetworkPrepState } from '../state/NetworkPrepState';
import { StartState } from '../state/StartState';
import { StopState } from '../state/StopState';
import { StateConfiguration } from '../types/StateConfiguration';
import { DebugState } from '../state/DebugState';

export class StateData {

    public getSelectedStateConfiguration(stateName: string): StateConfiguration | undefined {
        switch (stateName) {
            case 'start':
                return this.getStartConfiguration();
            case 'restart':
                return this.getRestartConfiguration();
            case 'stop':
                return this.getStopConfiguration();
            case 'accountCreation':
                return this.getAccountCreationConfiguration();
            case 'debug':
                return this.getDebugConfiguration();
            default:
                return undefined;
        }
    }
        
    private getRestartConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'restart',
            'states' : [
                new CleanUpState(),
                new StopState(),
                new InitState(),
                new StartState(),
                new NetworkPrepState(),
                new AccountCreationState(),
                new CleanUpState(),
                new AttachState()
            ]
        };
    }

    private getStartConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'start',
            'states' : [
                new InitState(),
                new StartState(),
                new NetworkPrepState(),
                new AccountCreationState(),
                new CleanUpState(),
                new AttachState()
                
            ]
        };
    }

    private getStopConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'stop',
            'states' : [
                new StopState()
            ]
        };
    }

    private getAccountCreationConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'accountCreation',
            'states' : [
                new AccountCreationState()
            ]
        }
    }

    private getDebugConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'debug',
            'states' : [
                new DebugState()
            ]
        }
    }
}
