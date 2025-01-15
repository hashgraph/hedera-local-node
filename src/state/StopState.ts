// SPDX-License-Identifier: Apache-2.0

import shell from 'shelljs';
import { join } from 'path';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { EventType } from '../types/EventType';
import {
    DOCKER_CLEANING_VOLUMES_MESSAGE,
    DOCKER_STOPPING_CONTAINERS_MESSAGE,
    IS_WINDOWS,
    STOP_STATE_INIT_MESSAGE,
    STOP_STATE_ON_START_MESSAGE,
    STOP_STATE_STOPPED_MESSAGE,
    STOP_STATE_STOPPING_MESSAGE
} from '../constants';
import { CLIOptions } from '../types/CLIOptions';
import { CLIService } from '../services/CLIService';
import { SafeDockerNetworkRemover } from '../utils/SafeDockerNetworkRemover';

export class StopState implements IState {
    /**
     * The logger service used for logging.
     */
    private logger: LoggerService;

    /**
     * The observer for the StopState.
     */
    private observer: IOBserver | undefined;

    /**
     * The CLI options for the StartState class.
     */
    private cliOptions: CLIOptions;

    /**
     * The name of the state.
     */
    private stateName: string;
    
    /**
     * Creates an instance of StopState. 
     * This class is responsible for initializing the StopState object.
     */
    constructor() {
        this.stateName = StopState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace(STOP_STATE_INIT_MESSAGE, this.stateName);
    }

    /**
     * Subscribes an observer to the state.
     * 
     * @public
     * @param {IOBserver} observer - The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * Starts the stop procedure.
     * Stops the network, docker containers, and cleans up volumes and temporary files.
     * Notifies the observer when the procedure is finished.
     * @returns {Promise<void>} A promise that resolves when the procedure is finished.
     */
    public async onStart(): Promise<void> {
        this.logger.info(STOP_STATE_ON_START_MESSAGE, this.stateName);

        const nullOutput = this.getNullOutput();
        const rootPath = process.cwd();

        this.logger.info(STOP_STATE_STOPPING_MESSAGE, this.stateName);
        shell.cd(__dirname);
        shell.cd('../../');
        this.logger.trace(DOCKER_STOPPING_CONTAINERS_MESSAGE, this.stateName);
        shell.exec(`docker compose kill --remove-orphans 2>${nullOutput}`);
        shell.exec(`docker compose down -v --remove-orphans 2>${nullOutput}`);
        this.logger.trace(DOCKER_CLEANING_VOLUMES_MESSAGE, this.stateName);
        shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
        this.logger.trace(`Working dir is ${this.cliOptions.workDir}`, this.stateName);
        shell.exec(`rm -rf "${join(this.cliOptions.workDir, 'network-logs')}" >${nullOutput} 2>&1`);
        SafeDockerNetworkRemover.removeAll();
        shell.cd(rootPath);
        this.logger.info(STOP_STATE_STOPPED_MESSAGE, this.stateName);
        this.observer?.update(EventType.Finish);
    }

    /**
     * Returns the null output path based on the operating system.
     * On Windows, it returns "null".
     * On other operating systems, it returns "/dev/null".
     * @returns {string}
     */
    private getNullOutput(): "null" | "/dev/null" {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }

}
