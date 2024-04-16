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

import { AccountCreationState } from '../state/AccountCreationState';
import { CleanUpState } from '../state/CleanUpState';
import { AttachState } from '../state/AttachState';
import { InitState } from '../state/InitState';
import { NetworkPrepState } from '../state/NetworkPrepState';
import { StartState } from '../state/StartState';
import { StopState } from '../state/StopState';
import { StateConfiguration } from '../types/StateConfiguration';
import { DebugState } from '../state/DebugState';
import { ResourceCreationState } from '../state/ResourceCreationState';

/**
 * Class representing the state data.
 */
export class StateData {
    /**
     * Get the selected state configuration based on the state name.
     * @param {string} stateName - The name of the state.
     * @returns {StateConfiguration | undefined} The configuration for the selected state, or undefined if the state name is not recognized.
     * @public
     */
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
            case 'resourceCreation':
                return this.getResourceCreationConfiguration();
            case 'debug':
                return this.getDebugConfiguration();
            default:
                return undefined;
        }
    }

    /**
     * Get the configuration for the restart state.
     * @returns {StateConfiguration} The configuration for the restart state.
     * @private
     */
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
                new ResourceCreationState(),
                new CleanUpState(),
                new AttachState()
            ]
        };
    }

    /**
     * Get the configuration for the start state.
     * @returns {StateConfiguration} The configuration for the start state.
     * @private
     */
    private getStartConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'start',
            'states' : [
                new InitState(),
                new StartState(),
                new NetworkPrepState(),
                new AccountCreationState(),
                new ResourceCreationState(),
                new CleanUpState(),
                new AttachState()
            ]
        };
    }

    /**
     * Get the configuration for the stop state.
     * @returns {StateConfiguration} The configuration for the stop state.
     * @private
     */
    private getStopConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'stop',
            'states' : [
                new StopState()
            ]
        };
    }

    /**
     * Get the configuration for the resource creation state.
     * @returns {StateConfiguration} The configuration for the resource creation state.
     * @private
     */
    private getResourceCreationConfiguration(): StateConfiguration {
        return {
            'stateMachineName': 'resourceCreation',
            'states': [
                new ResourceCreationState()
            ]
        };
    }

    /**
     * Get the configuration for the account creation state.
     * @returns {StateConfiguration} The configuration for the account creation state.
     * @private
     */
    private getAccountCreationConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'accountCreation',
            'states' : [
                new AccountCreationState()
            ]
        };
    }

    /**
     * Get the configuration for the debug state.
     * @returns {StateConfiguration} The configuration for the debug state.
     * @private
     */
    private getDebugConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'debug',
            'states' : [
                new DebugState()
            ]
        };
    }
}
