// SPDX-License-Identifier: Apache-2.0


import {
    CHECK_FAIL,
    CHECK_WARN,
    COLOR_DIM,
    COLOR_RESET,
    DEBUG_COLOR,
    ERROR_COLOR,
    INFO_COLOR,
    TRACE_COLOR,
    WARNING_COLOR,
} from '../constants';
import { VerboseLevel } from '../types/VerboseLevel';
import { IService } from './IService';

/**
 * LoggerService is a service class that handles logging.
 * It implements the IService interface.
 * @public
 */
export class LoggerService implements IService{
    /**
     * The logger used by the LoggerService.
     * @private
     */
    private readonly logger: Console;

    /**
     * The name of the service.
     * @private
     */
    private readonly serviceName: string;

    /**
     * The verbosity level of the LoggerService.
     * @private
     */
    private readonly verboseLevel: number;

    /**
     * Creates an instance of the LoggerService.
     * @param {number} verboseLevel - The level of verbosity for the logger service.
     */
    constructor(verboseLevel: number) {
        this.serviceName = LoggerService.name;
        this.verboseLevel = verboseLevel;
        this.logger = console;
        this.trace('Logger Service Initialized!', this.serviceName);
    }

    /**
     * Returns the color for the message written on the terminal
     * @param verboseLevel - The level of verbosity for the logger service. 
     * @returns {string} The name of the service.
     * @public
     */
    private static pickVerbosityColor(verboseLevel: VerboseLevel): string {
        switch (verboseLevel) { 
            case VerboseLevel.ERROR:
                return ERROR_COLOR;
            case VerboseLevel.WARNING:
                return WARNING_COLOR;
            case VerboseLevel.INFO:
                return INFO_COLOR;
            case VerboseLevel.DEBUG:
                return DEBUG_COLOR;
            case VerboseLevel.TRACE:
                return TRACE_COLOR;
            default:
                return INFO_COLOR;
        }
    }

    /**
     * Builds the message to log.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @param verboseLevel - The level of verbosity for the logger service.
     * @returns {string} The message to log.
     * @private
     */
    private static messageCompute(msg: string, module: string, verboseLevel: VerboseLevel): string {
        return `${COLOR_DIM}[Hedera-Local-Node]${COLOR_RESET}${LoggerService.pickVerbosityColor(verboseLevel)} ${VerboseLevel[verboseLevel]} ${COLOR_RESET}${COLOR_DIM}(${module})${COLOR_RESET} ${msg}`;
    }

    /**
     * Logs a trace message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public trace(msg: string, module: string = ''): void {
        if (this.verboseLevel < VerboseLevel.TRACE) {
            return;
        }
        const msgToLog = LoggerService.messageCompute(msg, module, VerboseLevel.TRACE);
        this.writeToLog(msgToLog, module);
    }

    /**
     * Logs a debug message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public info(msg: string, module: string = ''): void {
        if (this.verboseLevel < VerboseLevel.INFO) {
            return;
        }
        const msgToLog = LoggerService.messageCompute(msg, module, VerboseLevel.INFO);
        this.writeToLog(msgToLog, module);
    }

    /**
     * Logs a warning message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public warn(msg: string, module: string = ''): void {
        if (this.verboseLevel < VerboseLevel.WARNING) {
            return;
        }
        const msgToLog = LoggerService.messageCompute(`${CHECK_WARN} ${msg}`, module, VerboseLevel.WARNING);
        this.writeToLog(msgToLog, module);
    }

    /**
     * 
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public error(msg: string, module: string = ''): void {
        if (this.verboseLevel < VerboseLevel.ERROR) {
            return;
        }
        const msgToLog = LoggerService.messageCompute(`${CHECK_FAIL} ${msg}`, module, VerboseLevel.ERROR);
        this.writeToLog(msgToLog, module);
    }

    /**
     * 
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public debug(msg: string, module: string = ''): void {
        if (this.verboseLevel < VerboseLevel.DEBUG) {
            return;
        }
        const msgToLog = LoggerService.messageCompute(msg, module, VerboseLevel.DEBUG);
        this.writeToLog(msgToLog, module);
    }

    /**
     * Writes a message to the log.
     * @param msg - The message to write.
     * @param module - The module where the message originates.
     */
    private writeToLog(msg: string, module: string): void {
        this.logger.log(msg);
    }
}
