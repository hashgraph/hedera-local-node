// SPDX-License-Identifier: Apache-2.0

import { IState } from "../state/IState";

/**
 * Represents the configuration of a state machine.
 * 
 * @interface
 * @public
 * @property {string} stateMachineName - The name of the state machine.
 * @property {Array<IState>} states - The states of the state machine.
 */
export interface StateConfiguration {
    stateMachineName: string;
    states: Array<IState>;
}
