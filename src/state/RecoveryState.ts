// SPDX-License-Identifier: Apache-2.0

import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import { DockerService } from '../services/DockerService';
import { RECOVERY_STATE_INIT_MESSAGE, RECOVERY_STATE_STARTING_MESSAGE } from '../constants';

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
     * Represents the Docker service used by the StartState class.
     */
    private dockerService: DockerService;

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
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace(RECOVERY_STATE_INIT_MESSAGE, this.stateName);
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
        this.logger.info(RECOVERY_STATE_STARTING_MESSAGE, this.stateName);

        switch (this.eventType) {
            case EventType.DockerError:
                await this.dockerService.tryDockerRecovery(this.stateName);
            default:
                this.observer?.update(EventType.UnknownError);
                break;
        }
    }
}
