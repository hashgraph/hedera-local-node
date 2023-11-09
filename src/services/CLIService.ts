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

import { ArgumentsCamelCase, Argv } from 'yargs';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { NetworkType } from '../types/NetworkType';


export class CLIService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    private currentArgv: ArgumentsCamelCase<{}> | undefined;

    private isStartup: boolean;

    constructor() {
        this.serviceName = CLIService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('CLI Service Initialized!', this.serviceName);
        this.isStartup = true;
    }

    public loadStartupOptions(yargs: Argv<{}>): void {
        this.loadAccountOptions(yargs);
        this.detachedOption(yargs);
        this.hostOption(yargs);
        this.networkOption(yargs);
        this.rateLimitOption(yargs);
        this.devModeOption(yargs);
        this.fullModeOption(yargs);
        this.multiNodeOption(yargs);
        this.userComposeOption(yargs);
        this.userComposeDirOption(yargs);
        this.blocklistingOption(yargs);
        this.isStartup = true;
    }

    public loadDebugOptions(yargs: Argv<{}>): void {
        this.timestampOption(yargs);
        this.isStartup = false;
    }

    public loadAccountOptions(yargs: Argv<{}>): void {
        this.accountOption(yargs);
        this.asyncOption(yargs);
        this.balanceOption(yargs);
        this.hostOption(yargs);
        this.isStartup = false;
    }

    public getCurrentArgv(){
        const argv = this.currentArgv as ArgumentsCamelCase<{}>;
        const accounts: number = argv.accounts as number;
        const async: any = argv.async as boolean;
        const balance: number = argv.balance as number;
        const detached: boolean = argv.detached as boolean;
        const host: string = argv.host as string;
        const network: NetworkType = this.resolveNetwork(argv.network as string);
        const limits: boolean = argv.limits as boolean;
        const devMode: boolean = argv.dev as boolean;
        const fullMode: boolean = argv.full as boolean;
        const multiNode: boolean = argv.multinode as boolean;
        const userCompose: boolean = argv.usercompose as boolean;
        const userComposeDir: string = argv.composedir as string;
        const blocklisting: boolean = argv.blocklist as boolean;
        const startup: boolean = this.isStartup;

        const currentArgv: CLIOptions = {
            accounts,
            async,
            balance,
            detached,
            host,
            network,
            limits,
            devMode,
            fullMode,
            multiNode,
            userCompose,
            userComposeDir,
            blocklisting,
            startup
        };

        return currentArgv;
    }

    public setCurrentArgv(argv: ArgumentsCamelCase<{}>): void {
        this.currentArgv = argv;
    }

    private accountOption(yargs: Argv<{}>): void {
        yargs.positional('accounts', {
            describe: 'Generated accounts of each type.',
            default: 10
        });
    }

    private detachedOption(yargs: Argv<{}>): void {
        yargs.option('detached', {
            alias: 'd',
            type: 'boolean',
            describe: 'Run the local node in detached mode',
            demandOption: false,
            default: false
          });
    }

    private hostOption(yargs: Argv<{}>): void {
        yargs.option('host', {
            alias: 'h',
            type: 'string',
            describe: 'Run the local node with host',
            demandOption: false,
            default: '127.0.0.1'
          });
    }

    private networkOption(yargs: Argv<{}>): void {
        yargs.option('network', {
            alias: 'n',
            type: 'string',
            describe:
              "Select the network configuration. Pre-built configs: ['mainnet', 'previewnet', 'testnet', 'local']",
            demandOption: false,
            default: 'local'
          });
    }

    private rateLimitOption(yargs: Argv<{}>): void {
        yargs.option('limits', {
            alias: 'l',
            type: 'boolean',
            describe: 'Enable or disable the rate limits in the JSON-RPC relay',
            demandOption: false,
            default: false
          });
    }

    private timestampOption(yargs: Argv<{}>): void {
        yargs.option('timestamp', {
            type: 'string',
            describe: 'Record file timestamp',
            demandOption: true
          });
    }

    private devModeOption(yargs: Argv<{}>): void {
        yargs.option('dev', {
            type: 'boolean',
            describe: 'Enable or disable developer mode',
            demandOption: false,
            default: false
          });
    }

    private fullModeOption(yargs: Argv<{}>): void {
        yargs.option('full', {
            type: 'boolean',
            describe: 'Enable or disable full mode. Production local-node.',
            demandOption: false,
            default: false
          });
    }

    private multiNodeOption(yargs: Argv<{}>): void {
        yargs.option('multinode', {
            type: 'boolean',
            describe: 'Enable or disable multi-node mode.',
            demandOption: false,
            default: false
          });
    }

    private balanceOption(yargs: Argv<{}>): void {
        yargs.option('balance', {
            type: 'number',
            describe: 'Set starting balance of the created accounts in HBAR',
            demandOption: false,
            default: 10000
          });
    }

    private asyncOption(yargs: Argv<{}>): void {
        yargs.option('async', {
            alias: 'a',
            type: 'boolean',
            describe: 'Enable or disable asynchronous creation of accounts',
            demandOption: false,
            default: false
          });
    }

    private userComposeOption(yargs: Argv<{}>): void {
        yargs.option('usercompose', {
            type: 'boolean',
            describe: 'Enable or disable user Compose configuration files',
            demandOption: false,
            default: true
          });
    }

    private userComposeDirOption(yargs: Argv<{}>): void {
        yargs.option('composedir', {
            type: 'string',
            describe: 'Path to a directory with user Compose configuration files',
            demandOption: false,
            default: './overrides/'
          });
    }

    private blocklistingOption(yargs: Argv<{}>): void {
        yargs.option('blocklist', {
            alias: 'b',
            type: 'boolean',
            describe: 'Enable or disable blocklisting accounts',
            demandOption: false,
            default: false
          });
    }
    
    private resolveNetwork(network: string): NetworkType {
        switch (network) {
            case 'local':
                return NetworkType.LOCAL;
            case 'mainnet':
                return NetworkType.MAINNET;
            case 'testnet':
                return NetworkType.TESTNET;
            case 'previewnet':
                return NetworkType.PREVIEWNET;
            default:
                return NetworkType.LOCAL;
        }
    }
}
