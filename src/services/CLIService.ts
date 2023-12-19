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

import yargs, { ArgumentsCamelCase, Argv } from 'yargs';
import { IService } from './IService';
import { CLIOptions } from '../types/CLIOptions';
import { NetworkType } from '../types/NetworkType';
import { VerboseLevel } from '../types/VerboseLevel';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';

export class CLIService implements IService{
    private logger: LoggerService;
    
    private serviceName: string;
    
    private currentArgv: ArgumentsCamelCase<{}> | undefined;

    public get verboseLevel() : string {
        return this.currentArgv?.verboseLevel as string;
    }
    
    constructor(argv: yargs.ArgumentsCamelCase<{}>) {
        this.serviceName = CLIService.name;
        this.setCurrentArgv(argv);
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('CLI Service Initialized!', this.serviceName);
    }

    public static loadStartupOptions(yargs: Argv<{}>): void {
        CLIService.loadCommonOptions(yargs)
        CLIService.loadAccountOptions(yargs, true);
        CLIService.detachedOption(yargs);
        CLIService.hostOption(yargs);
        CLIService.networkOption(yargs);
        CLIService.rateLimitOption(yargs);
        CLIService.devModeOption(yargs);
        CLIService.fullModeOption(yargs);
        CLIService.multiNodeOption(yargs);
        CLIService.userComposeOption(yargs);
        CLIService.userComposeDirOption(yargs);
        CLIService.blocklistingOption(yargs);
    }

    public static loadDebugOptions(yargs: Argv<{}>): void {
        CLIService.loadCommonOptions(yargs)
        CLIService.timestampOption(yargs);
    }

    public static loadAccountOptions(yargs: Argv<{}>, skipCommon = false): void {
        if(!skipCommon) CLIService.loadCommonOptions(yargs)
        CLIService.accountOption(yargs);
        CLIService.asyncOption(yargs);
        CLIService.balanceOption(yargs);
        CLIService.hostOption(yargs);
    }

    public static loadStopOptions(yargs: Argv<{}>): void {
        CLIService.loadCommonOptions(yargs);
    }

    private static loadCommonOptions(yargs: Argv<{}>): void {
        CLIService.verboseLevelOption(yargs);
    }

    public getCurrentArgv(){
        const argv = this.currentArgv as ArgumentsCamelCase<{}>;
        const accounts = argv.accounts as number;
        const async = argv.async as boolean;
        const balance = argv.balance as number;
        const detached = argv.detached as boolean;
        const host = argv.host as string;
        const network = CLIService.resolveNetwork(argv.network as string);
        const limits = argv.limits as boolean;
        const devMode = argv.dev as boolean;
        const fullMode = argv.full as boolean;
        const multiNode = argv.multinode as boolean;
        const userCompose = argv.usercompose as boolean;
        const userComposeDir = argv.composedir as string;
        const blocklisting = argv.blocklist as boolean;
        const startup = argv.startup as boolean;
        const verbose = CLIService.resolveVerboseLevel(argv.verbose as string);

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
            startup,
            verbose
        };

        return currentArgv;
    }

    public setCurrentArgv(argv: ArgumentsCamelCase<{}>): void {
        const state = argv._[0] as string
        this.currentArgv = {
            ...argv,
            detached: CLIService.isStartup(state) ? argv.detached : true,
            startup: CLIService.isStartup(state)
        };
    }

    private static isStartup(state: string): boolean {
        switch (state) {
            case 'start':
                return true;
            case 'restart':
                return true;
            case 'stop':
                return false;
            case 'generate-accounts':
                return false;
            case 'debug':
                return false;
            default:
                return true;
        };
    }

    private static accountOption(yargs: Argv<{}>): void {
        yargs.positional('accounts', {
            describe: 'Generated accounts of each type.',
            default: 10
        });
    }

    private static detachedOption(yargs: Argv<{}>): void {
        yargs.option('detached', {
            alias: 'd',
            type: 'boolean',
            describe: 'Run the local node in detached mode',
            demandOption: false,
            default: false
          });
    }

    private static hostOption(yargs: Argv<{}>): void {
        yargs.option('host', {
            alias: 'h',
            type: 'string',
            describe: 'Run the local node with host',
            demandOption: false,
            default: '127.0.0.1'
          });
    }

    private static networkOption(yargs: Argv<{}>): void {
        yargs.option('network', {
            alias: 'n',
            type: 'string',
            describe:
              "Select the network configuration. Pre-built configs: ['mainnet', 'previewnet', 'testnet', 'local']",
            demandOption: false,
            default: 'local'
          });
    }

    private static rateLimitOption(yargs: Argv<{}>): void {
        yargs.option('limits', {
            alias: 'l',
            type: 'boolean',
            describe: 'Enable or disable the rate limits in the JSON-RPC relay',
            demandOption: false,
            default: false
          });
    }

    private static timestampOption(yargs: Argv<{}>): void {
        yargs.option('timestamp', {
            type: 'string',
            describe: 'Record file timestamp',
            demandOption: true
          });
    }

    private static devModeOption(yargs: Argv<{}>): void {
        yargs.option('dev', {
            type: 'boolean',
            describe: 'Enable or disable developer mode',
            demandOption: false,
            default: false
          });
    }

    private static fullModeOption(yargs: Argv<{}>): void {
        yargs.option('full', {
            type: 'boolean',
            describe: 'Enable or disable full mode. Production local-node.',
            demandOption: false,
            default: false
          });
    }

    private static multiNodeOption(yargs: Argv<{}>): void {
        yargs.option('multinode', {
            type: 'boolean',
            describe: 'Enable or disable multi-node mode.',
            demandOption: false,
            default: false
          });
    }

    private static balanceOption(yargs: Argv<{}>): void {
        yargs.option('balance', {
            type: 'number',
            describe: 'Set starting balance of the created accounts in HBAR',
            demandOption: false,
            default: 10000
          });
    }

    private static asyncOption(yargs: Argv<{}>): void {
        yargs.option('async', {
            alias: 'a',
            type: 'boolean',
            describe: 'Enable or disable asynchronous creation of accounts',
            demandOption: false,
            default: false
          });
    }

    private static userComposeOption(yargs: Argv<{}>): void {
        yargs.option('usercompose', {
            type: 'boolean',
            describe: 'Enable or disable user Compose configuration files',
            demandOption: false,
            default: true
          });
    }

    private static userComposeDirOption(yargs: Argv<{}>): void {
        yargs.option('composedir', {
            type: 'string',
            describe: 'Path to a directory with user Compose configuration files',
            demandOption: false,
            default: './overrides/'
          });
    }

    private static blocklistingOption(yargs: Argv<{}>): void {
        yargs.option('blocklist', {
            alias: 'b',
            type: 'boolean',
            describe: 'Enable or disable blocklisting accounts',
            demandOption: false,
            default: false
          });
    }

    public static verboseLevelOption(yargs: Argv<{}>): void {
        yargs.option('verbose', {
            type: 'string',
            describe: 'Set the verbose level',
            demandOption: false,
            choices: ['info', 'trace'],
            default: 'info',
          });
    }
    
    private static resolveNetwork(network: string): NetworkType {
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

    public static resolveVerboseLevel(level: string): VerboseLevel {
        switch (level) {
            case 'info':
                return VerboseLevel.INFO;
            case 'trace':
                return VerboseLevel.TRACE;
            default:
                return VerboseLevel.INFO;
        }
    }
}
