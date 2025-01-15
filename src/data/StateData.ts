// SPDX-License-Identifier: Apache-2.0

import { AccountCreationState } from '../state/AccountCreationState';
import { CleanUpState } from '../state/CleanUpState';
import { AttachState } from '../state/AttachState';
import { InitState } from '../state/InitState';
import { NetworkPrepState } from '../state/NetworkPrepState';
import { StartState } from '../state/StartState';
import { StopState } from '../state/StopState';
import { StateConfiguration } from '../types/StateConfiguration';
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
}
