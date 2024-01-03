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

import { Widgets, screen, log } from 'blessed';
import terminal from 'blessed-terminal';
import { IService } from './IService';
import { ServiceLocator } from './ServiceLocator';
import { CLIService } from './CLIService';
import {
    CONSENSUS_NODE_LABEL,
    CONTAINERS,
    MIRROR_NODE_LABEL,
    RELAY_LABEL
} from '../constants';
import { ConnectionService } from './ConnectionService';
import { DockerService } from './DockerService';
import { VerboseLevel } from '../types/VerboseLevel';

/**
 * LoggerService is a service class that handles logging.
 * It implements the IService interface.
 * It uses the 'blessed' and 'blessed-terminal' modules to create a terminal user interface for logging.
 * It also uses the 'console' object for logging when the terminal user interface is not used.
 * @public
 */
export class LoggerService implements IService{
    /**
     * The logger used by the LoggerService.
     * @private
     */
    private logger: any;
    
    /**
     * The name of the service.
     * @private
     */
    private serviceName: string;

    /**
     * The screen used by the LoggerService.
     * @private
     */
    private screen: Widgets.Screen | undefined;

    /**
     * The grid used by the LoggerService.
     * @private
     */
    private grid: terminal.grid | undefined;

    /**
     * The status table element used by the LoggerService.
     * @private
     */
    private status: terminal.Widgets.TableElement | undefined;

    /**
     * The consensus log element used by the LoggerService.
     * @private
     */
    private consensusLog: terminal.Widgets.LogElement | undefined;

    /**
     * The mirror log element used by the LoggerService.
     * @private
     */
    private mirrorLog: terminal.Widgets.LogElement | undefined;

    /**
     * The relay log element used by the LoggerService.
     * @private
     */
    private relayLog: terminal.Widgets.LogElement | undefined;

    /**
     * The account board log element used by the LoggerService.
     * @private
     */
    private accountBoard: terminal.Widgets.LogElement | undefined;

    /**
     * The info board table element used by the LoggerService.
     * @private
     */
    private infoBoard: terminal.Widgets.TableElement | undefined;

    /**
     * The verbosity level of the LoggerService.
     * @private
     */
    private verboseLevel: number;


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
     * Logs a trace message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public trace(msg: string, module: string = ''): void {
        if (this.verboseLevel === VerboseLevel.INFO) {
            return;
        }
        const msgToLog = `[Hedera-Local-Node]\x1b[37m TRACE \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    /**
     * Logs a debug message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public info(msg: string, module: string = ''): void {
        const msgToLog = `[Hedera-Local-Node]\x1b[32m INFO \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    /**
     * Logs a warning message.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     * @public
     */
    public error(msg: string, module: string = ''): void {
        const msgToLog = `[Hedera-Local-Node]\x1b[31m ERROR \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    /**
     * Logs an empty line.
     */
    public emptyLine(): void {
        const detached = this.getLogMode();
        if (detached) {
            this.logger.log('');
        } else {
            this.logToTUI('', '');
        }
    }

    /**
     * Attaches a terminal user interface to the logger.
     * @param msg - The message to log.
     * @param containerLabel - The container label.
     * @public
     */
    public attachTUI(msg: string, containerLabel: string): void {
        switch (containerLabel) {
            case CONSENSUS_NODE_LABEL:
                this.consensusLog?.log(msg);
                break;
            case RELAY_LABEL:
                this.relayLog?.log(msg);
                break;
            case MIRROR_NODE_LABEL:
                this.mirrorLog?.log(msg);
                break;
            default:
                this.consensusLog?.log(msg);
                break;
        }
    }

    /**
     * Writes a message to the log.
     * @param msg - The message to write.
     * @param module - The module where the message originates.
     */
    private writeToLog(msg: string, module: string): void {
        const detached = this.getLogMode();
        if (detached) {
            this.logger.log(msg);
        } else {
            this.logToTUI(msg, module);
        }
    }

    /**
     * Returns the log mode.
     * @returns {boolean} True if the log mode is detached, false otherwise.
     */
    private getLogMode(): boolean {
        let isDetached = true;
        try {
            isDetached = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv().detached;
        } catch (e: any) {
            // Do nothing, this will only occur when service has not been initilized still.
        }
        return isDetached;
    }

    /**
     * Logs a message to the terminal user interface.
     * @param msg - The message to log.
     * @param module - The module where the message originates.
     */
    private logToTUI(msg: string, module: string): void {
        if (this.screen === undefined) {
            this.initiliazeTerminalUI();
        }
        const consensusLog = this.consensusLog as terminal.Widgets.LogElement;
        const accountBoard = this.accountBoard as terminal.Widgets.LogElement;
        switch (module) {
            case "InitState":
                consensusLog.log(msg);
                break;
            case "NetworkPrepState":
                consensusLog.log(msg);
                break;
            case "StartState":
                consensusLog.log(msg);
                break;
            case "AccountCreationState":
                accountBoard.log(msg);
                break;
            default:
                consensusLog.log(msg);
                break;
        }
    }

    /**
     * Initializes the terminal user interface.
     */
    private initiliazeTerminalUI(): void {
        const window: Widgets.Screen = screen({
            smartCSR: true,
        });

        window.title = "Hedera Local Node";
        this.grid = new terminal.grid({ rows: 12, cols: 12, screen: window });

        this.infoBoard = this.initiliazeInfoBoard(this.grid);
        this.status = this.initiliazeStatusBoard(this.grid);
        const consensusLog = this.initiliazeConsensusLog(this.grid);
        const mirrorLog = this.initiliazeMirrorLog(this.grid);
        const relayLog = this.initiliazeRelayLog(this.grid);
        const accountBoard = this.initializeAccountBoard(this.grid);
        //assign key events

        window.key(
            ["tab", "C-c", "1", "2", "3", "4"],
            async function (ch, key) {
                if (key.name == "tab") {
                    window.focusNext();
                } else if (ch == "1") {
                    mirrorLog.hide();
                    relayLog.hide();
                    accountBoard.hide();
                    consensusLog.show();
                    consensusLog.focus();
                } else if (ch == "2") {
                    relayLog.hide();
                    accountBoard.hide();
                    consensusLog.hide();
                    mirrorLog.show();
                    mirrorLog.focus();
                } else if (ch == "3") {
                    mirrorLog.hide();
                    accountBoard.hide();
                    consensusLog.hide();
                    relayLog.show();
                    relayLog.focus();
                } else if (ch == "4") {
                    mirrorLog.hide();
                    relayLog.hide();
                    consensusLog.hide();
                    accountBoard.show();
                    accountBoard.focus();
                } else {
                    window.destroy();
                    return process.exit(0);
                }
                window.render();
            }
            );
        window.render();
        this.screen = window;
        this.consensusLog = consensusLog;
        this.mirrorLog = mirrorLog;
        this.relayLog = relayLog;
        this.accountBoard = accountBoard;
    }

    /**
     * Initializes the info board.
     * @param {terminal.grid} grid - The grid where the info board is placed.
     * @returns {terminal.Widgets.TableElement} The initialized info board.
     */
    private initiliazeInfoBoard(grid: terminal.grid): terminal.Widgets.TableElement {
        const info = grid.set(0, 7, 2, 3, terminal.table, {
            keys: true,
            fg: "white",
            label: "Commands Information",
            columnSpacing: 1,
            columnWidth: [10, 30, 30],
          });
        info.setData({
            headers: ["Key", "Command"],
            data: [
              ["1", "Open Consensus Node Board"],
              ["2", "Open Mirror Node Log Board"],
              ["3", "Open Relay Log Board"],
              ["4", "Open Account Board"],
            ],
        });
        return info;
    }

    /**
     * Initializes the status board.
     * @param {terminal.grid} grid - The grid where the status board is placed.
     * @returns {terminal.Widgets.TableElement} The initialized status board.
     */
    private initiliazeStatusBoard(grid: terminal.grid): terminal.Widgets.TableElement {
        const statusBoard = grid.set(0, 0, 2, 7, terminal.table, {
            keys: true,
            fg: "white",
            label: "Status",
            columnSpacing: 5,
            columnWidth: [15, 15, 15, 15, 15],
        });
        statusBoard.setData({
            headers: ["Application", "Version", "Status", "Host", "Port"],
            data: [],
        });

        return statusBoard;
    }

    /**
     * Updates the status board.
     * @returns {Promise<void>} A promise that resolves when the status board is updated.
     * 
     * @remarks
     * This method is called by the States.
     */
    public async updateStatusBoard(): Promise<void> {
        const isDetached = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv().detached;

        if (isDetached) {
            return;
        }
        const host = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv().host;
        const connectionCheckService = ServiceLocator.Current.get<ConnectionService>(ConnectionService.name);
        const dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        const status = this.status as terminal.Widgets.TableElement;

        let data: any[][] = [];
        await Promise.all(
        CONTAINERS.map(async (container) => {
            let row = [];
            const status = await connectionCheckService.checkConnection(container.port)
            .then(
            function () {
                return `Running`;
            },
            function () {
                return "Not Running";
            }
            );

            const verison = await dockerService.getContainerVersion(container.label);
            row.push(container.name);
            row.push(verison);
            row.push(status);
            row.push(host);
            row.push(container.port)
            data.push(row);
        })
        );
        status.setData({
        headers: ["Application", "Version", "Status", "Host", "Port"],
        data: data,
        });
        status.render();
    }

    /**
     * Initializes the consensus log.
     * @param {terminal.grid} grid - The grid where the consensus log is placed.
     * @returns {terminal.Widgets.LogElement} - The initialized consensus log.
     */
    private initiliazeConsensusLog(grid: terminal.grid): terminal.Widgets.LogElement {
        const consensusLog = grid.set(2, 0, 10, 12, log, {
            fg: "white",
            selectedFg: "white",
            label: "Consensus Node Log",
            scrollable: true,
            focused: true,
            keys: true,
            vi: true,
            scrollbar: {
              ch: " ",
              inverse: true,
            },
          });

        return consensusLog;
    }

    /**
     * Initializes the mirror log.
     * @param {terminal.grid} grid - The grid where the mirror log is placed.
     * @returns {terminal.Widgets.LogElement} - The initialized mirror log.
     */
    private initiliazeMirrorLog(grid: terminal.grid): terminal.Widgets.LogElement {
        const mirrorLog = grid.set(2, 0, 10, 12, log, {
            fg: "white",
            selectedFg: "white",
            label: "Mirror Node Log",
            scrollable: true,
            focused: true,
            keys: true,
            vi: true,
            scrollbar: {
              ch: " ",
              inverse: true,
            },
        });

        mirrorLog.hide();
        return mirrorLog;
    }

    /**
     * Initializes the relay log.
     * @param {terminal.grid} grid - The grid where the relay log is placed.
     * @returns {terminal.Widgets.LogElement} - The initialized relay log.
     */
    private initiliazeRelayLog(grid: terminal.grid): terminal.Widgets.LogElement {
        const relayLog = grid.set(2, 0, 10, 12, log, {
            fg: "white",
            selectedFg: "white",
            label: "Relay Log",
            scrollable: true,
            focused: true,
            keys: true,
            vi: true,
            scrollbar: {
              ch: " ",
              inverse: true,
            },
        });

        relayLog.hide();
        return relayLog;
    }

    /**
     * Initializes the account board.
     * @param {terminal.grid} grid - The grid where the account board is placed.
     * @returns {terminal.Widgets.LogElement} The initialized account board.
     */
    private initializeAccountBoard(grid: terminal.grid): terminal.Widgets.LogElement {
        const accountBoard = grid.set(2, 0, 10, 12, log, {
            fg: "white",
            selectedFg: "white",
            label: "Account Board",
            scrollable: true,
            focused: true,
            keys: true,
            vi: true,
            scrollbar: {
              ch: " ",
              inverse: true,
            },
        });

        accountBoard.hide();
        return accountBoard;
    }
}
