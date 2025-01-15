// SPDX-License-Identifier: Apache-2.0

import { CHECK_FAIL, CHECK_SUCCESS } from '../constants';
import { StateData } from '../data/StateData';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { CleanUpState } from '../state/CleanUpState';
import { RecoveryState } from '../state/RecoveryState';
import { EventType } from '../types/EventType';
import { StateConfiguration } from '../types/StateConfiguration';
import { IOBserver } from './IObserver';

/**
 * Represents a state controller that manages the state machine.
 * Implements the IOBserver interface.
 * @implements {IObserver}
 */
export class StateController implements IOBserver{
    /**
     * Logger service instance.
     * @private
     */
    private logger: LoggerService;

    /**
     * Configuration for the state.
     * @private
     */
    private stateConfiguration: StateConfiguration | undefined;
    
    /**
     * Current state number.
     * @private
     */
    private currStateNum: number;

    /**
     * Maximum state number.
     * @private
     */
    private maxStateNum: number;

    /**
     * Name of the controller.
     * @private
     */
    private controllerName: string;

    /**
     * Constructs a new instance of the StateController class.
     * @param stateName - The name of the state.
     */
    constructor(stateName: string) {
        this.controllerName = StateController.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.stateConfiguration = new StateData().getSelectedStateConfiguration(stateName);
        this.currStateNum = 0;
        this.maxStateNum = 0;
        this.logger.trace(`${CHECK_SUCCESS} State Controller Initialized!`, this.controllerName);
        this.logger.info(`${CHECK_SUCCESS} Starting ${stateName} procedure!`, this.controllerName);
    }

    /**
     * Starts the state machine.
     * If the state configuration is not set, it logs an error and exits the process.
     * Subscribes to the current state and calls the onStart method of the current state.
     */
    public async startStateMachine() {
        if (!this.stateConfiguration) {
            this.logger.error(`${CHECK_FAIL} Something is wrong with state configuration!`, this.controllerName);
            // TODO: handle error
            process.exit(1);
        } else {
            this.maxStateNum = this.stateConfiguration.states.length - 1;
            this.stateConfiguration.states[this.currStateNum].subscribe(this);
            await this.stateConfiguration.states[this.currStateNum].onStart();
        }
    }

    /**
     * Updates the state based on the given event.
     * If the event is EventType.Finish, transitions to the next state.
     * If the event is EventType.UnknownError, performs cleanup and exits the process with code 1.
     * Otherwise, starts a new RecoveryState with the given event.
     * @param {EventType} event - The event type.
     * @returns {Promise<void>}
     */
    public async update(event: EventType): Promise<void> {
        if (event === EventType.Finish) {
            await this.transitionToNextState();
        } else {
            if (event === EventType.UnknownError || event === EventType.UnresolvableError) {
                await new CleanUpState().onStart();
                process.exit(1);
            } else {
                await new RecoveryState(event).onStart();
            }
        }
    }

    /**
     * Transitions to the next state.
     * If the current state number is equal to or greater than the maximum state number,
     * the process will exit with a code of 0.
     * Otherwise, it increments the current state number, subscribes to the next state,
     * and calls the onStart method of the next state.
     * If an error occurs during the transition, it logs the error and exits the process with a code of 1,
     * unless the error is a TypeError, in which case it ignores the error and continues execution.
     * @returns {Promise<void>}
     * @private
     */
    private async transitionToNextState(): Promise<void> {
        if (this.currStateNum >= this.maxStateNum) {
            process.exit(0);
        }
        this.currStateNum+=1;

        try {
            this.stateConfiguration!.states[this.currStateNum].subscribe(this);
            await this.stateConfiguration!.states[this.currStateNum].onStart();
        } catch (error) {
            if (error instanceof TypeError) {
                // Ignore this error, it finds the methods and executes the code, but still results in TypeError
            } else {
                this.logger.error(`Trying to transition to next state was not possible. Error is: ${error}`, this.controllerName);
                process.exit(1);
            }
        }
    }
}
