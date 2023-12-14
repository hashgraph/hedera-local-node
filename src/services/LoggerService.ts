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

export class LoggerService implements IService{
    private logger: any;
    
    private serviceName: string;

    private screen: Widgets.Screen | undefined;

    private grid: terminal.grid | undefined;

    private status: terminal.Widgets.TableElement | undefined;

    private consensusLog: terminal.Widgets.LogElement | undefined;

    private mirrorLog: terminal.Widgets.LogElement | undefined;

    private relayLog: terminal.Widgets.LogElement | undefined;

    private accountBoard: terminal.Widgets.LogElement | undefined;

    private infoBoard: terminal.Widgets.TableElement | undefined;

    private verboseLevel: number;

    constructor(verboseLevel: number) {
        this.serviceName = LoggerService.name;
        this.verboseLevel = verboseLevel;
        this.logger = console;
        this.trace('Logger Service Initialized!', this.serviceName);
    }

    public trace(msg: string, module: string = ''): void {
        if (this.verboseLevel === VerboseLevel.INFO) {
            return;
        }
        const msgToLog = `[Hedera-Local-Node]\x1b[37m TRACE \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    public info(msg: string, module: string = ''): void {
        const msgToLog = `[Hedera-Local-Node]\x1b[32m INFO \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    public error(msg: string, module: string = ''): void {
        const msgToLog = `[Hedera-Local-Node]\x1b[31m ERROR \x1b[0m(${module}) ${msg}`;
        this.writeToLog(msgToLog, module);
    }

    public emptyLine(): void{
        const detached = this.getLogMode();
        if (detached) {
            this.logger.log('');
        } else {
            this.logToTUI('', '');
        }
    }

    public attachTUI(msg: string, containerLabel: string) {
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

    private writeToLog(msg: string, module: string) {
        const detached = this.getLogMode();
        if (detached) {
            this.logger.log(msg);
        } else {
            this.logToTUI(msg, module);
        }
    }

    private getLogMode() {
        let isDetached = true;
        try {
            isDetached = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv().detached;
        } catch (e: any) {
            // Do nothing, this will only occur when service has not been initilized still.
        }
        return isDetached;
    }

    private logToTUI(msg: string, module: string) {
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

    private initiliazeTerminalUI() {
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

    public async updateStatusBoard() {
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
