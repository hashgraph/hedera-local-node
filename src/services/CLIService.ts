/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
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
import { FileSystemUtils } from '../utils/FileSystemUtils';

/**
 * Class representing the CLI service.
 * @implements {IService}
 */
export class CLIService implements IService{
    /**
     * The logger service.
     * @private
     */
    private logger: LoggerService;
        
    /**
     * The name of the service.
     * @private
     */
    private serviceName: string;
        
    /**
     * The current command line arguments.
     * @private
     */
    private currentArgv: ArgumentsCamelCase<{}> | undefined;

    /**
     * Get the verbose level.
     * @returns {string} The verbose level.
     */
    public get verboseLevel() : string {
        return this.currentArgv?.verboseLevel as string;
    }
    
    /**
     * Create a CLI service.
     * @param {yargs.ArgumentsCamelCase<{}>} argv - The command line arguments.
     */
    constructor(argv: yargs.ArgumentsCamelCase<{}>) {
        this.serviceName = CLIService.name;
        this.setCurrentArgv(argv);
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('CLI Service Initialized!', this.serviceName);
    }

    /**
     * Loads the startup options for the CLI service.
     * @param {yargs.Argv<{}>} yargs - The yargs instance.
     */
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
        CLIService.enableDebugOption(yargs);
    }

    /**
     * Loads debug options for the CLI service.
     * @param {yargs.Argv<{}>} yargs - The yargs instance.
     */
    public static loadDebugOptions(yargs: Argv<{}>): void {
        CLIService.loadCommonOptions(yargs)
        CLIService.timestampOption(yargs);
    }

    /**
     * Loads the account options for the CLI.
     * @param {yargs.Argv<{}>} yargs - The yargs instance.
     * @param {boolean} skipCommon - Whether to skip loading common options.
     */
    public static loadAccountOptions(yargs: Argv<{}>, skipCommon = false): void {
        if(!skipCommon) CLIService.loadCommonOptions(yargs)
        CLIService.accountOption(yargs);
        CLIService.asyncOption(yargs);
        CLIService.balanceOption(yargs);
        CLIService.hostOption(yargs);
    }

    /**
     * Loads the stop options for the CLI.
     * @param {yargs.Argv<{}>} yargs - The yargs instance.
     */
    public static loadStopOptions(yargs: Argv<{}>): void {
        CLIService.loadCommonOptions(yargs);
    }

    /**
     * Loads the generate accounts options for the CLI.
     * @param {yargs.Argv<{}>} yargs - The yargs instance.
     */
    private static loadCommonOptions(yargs: Argv<{}>): void {
        CLIService.verboseLevelOption(yargs);
        CLIService.workDirOption(yargs);
    }

    /**
     * Get the current command line arguments.
     * @returns {CLIOptions} The current command line arguments.
     * @public
     */
    public getCurrentArgv() {
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
        const timestamp = argv.timestamp as string;
        const enableDebug = argv.enableDebug as boolean;
        const workDir = FileSystemUtils.parseWorkDir(argv.workdir as string);

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
            verbose,
            timestamp,
            enableDebug,
            workDir,
        };

        return currentArgv;
    }

    /**
     * Set the current command line arguments.
     * @param {yargs.ArgumentsCamelCase<{}>} argv - The current command line arguments.
     * @public
     */
    public setCurrentArgv(argv: ArgumentsCamelCase<{}>): void {
        const state = argv._[0] as string
        this.currentArgv = {
            ...argv,
            detached: CLIService.isStartup(state) ? argv.detached : true,
            startup: CLIService.isStartup(state)
        };
    }

    /**
     * Checks if the given state represents a startup operation.
     * @param {string} state - The state to check.
     * @returns {boolean} True if the state represents a startup operation, false otherwise.
     * @private
     */
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

    /**
     * Adds the 'accounts' option to the command line arguments.
     * This option specifies the number of generated accounts of each type.
     * It defaults to 10.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static accountOption(yargs: Argv<{}>): void {
        yargs.positional('accounts', {
            describe: 'Generated accounts of each type.',
            default: 10
        });
    }

    /**
     * Adds the 'detached' option to the command line arguments.
     * This option is a boolean that specifies whether to run the local node in detached mode.
     * It is not required and defaults to false.
     * The option can also be set using the alias 'd'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static detachedOption(yargs: Argv<{}>): void {
        yargs.option('detached', {
            alias: 'd',
            type: 'boolean',
            describe: 'Run the local node in detached mode',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'host' option to the command line arguments.
     * This option is a string that specifies the host to run the local node with.
     * It is not required and defaults to '127.0.0.1'.
     * The option can also be set using the alias 'h'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static hostOption(yargs: Argv<{}>): void {
        yargs.option('host', {
            alias: 'h',
            type: 'string',
            describe: 'Run the local node with host',
            demandOption: false,
            default: '127.0.0.1'
        });
    }

    /**
     * Adds the 'network' option to the command line arguments.
     * This option is a string that selects the network configuration.
     * Pre-built configs include 'mainnet', 'previewnet', 'testnet', and 'local'.
     * It is not required and defaults to 'local'.
     * The option can also be set using the alias 'n'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
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

    /**
     * Adds the 'limits' option to the command line arguments.
     * This option is a boolean that enables or disables the rate limits in the JSON-RPC relay.
     * It is not required and defaults to false.
     * The option can also be set using the alias 'l'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static rateLimitOption(yargs: Argv<{}>): void {
        yargs.option('limits', {
            alias: 'l',
            type: 'boolean',
            describe: 'Enable or disable the rate limits in the JSON-RPC relay',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'timestamp' option to the command line arguments.
     * This option is a string that records the file timestamp.
     * It is required.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static timestampOption(yargs: Argv<{}>): void {
        yargs.option('timestamp', {
            type: 'string',
            describe: 'Record file timestamp',
            demandOption: true
        });
    }

    /**
     * Adds the 'dev' option to the command line arguments.
     * This option is a boolean that enables or disables developer mode.
     * It is not required and defaults to false.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static devModeOption(yargs: Argv<{}>): void {
        yargs.option('dev', {
            type: 'boolean',
            describe: 'Enable or disable developer mode',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'full' option to the command line arguments.
     * This option is a boolean that enables or disables full mode for a production local-node.
     * It is not required and defaults to false.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static fullModeOption(yargs: Argv<{}>): void {
        yargs.option('full', {
            type: 'boolean',
            describe: 'Enable or disable full mode. Production local-node.',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'multinode' option to the command line arguments.
     * This option is a boolean that enables or disables multi-node mode.
     * It is not required and defaults to false.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static multiNodeOption(yargs: Argv<{}>): void {
        yargs.option('multinode', {
            type: 'boolean',
            describe: 'Enable or disable multi-node mode.',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'balance' option to the command line arguments.
     * This option is a number that sets the starting balance of the created accounts in HBAR.
     * It is not required and defaults to 10000.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static balanceOption(yargs: Argv<{}>): void {
        yargs.option('balance', {
            type: 'number',
            describe: 'Set starting balance of the created accounts in HBAR',
            demandOption: false,
            default: 10000
        });
    }

    /**
     * Adds the 'async' option to the command line arguments.
     * This option is a boolean that enables or disables asynchronous creation of accounts.
     * It is not required and defaults to false.
     * The option can also be set using the alias 'a'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static asyncOption(yargs: Argv<{}>): void {
        yargs.option('async', {
            alias: 'a',
            type: 'boolean',
            describe: 'Enable or disable asynchronous creation of accounts',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'usercompose' option to the command line arguments.
     * This option is a boolean that enables or disables user Compose configuration files.
     * It is not required and defaults to true.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static userComposeOption(yargs: Argv<{}>): void {
        yargs.option('usercompose', {
            type: 'boolean',
            describe: 'Enable or disable user Compose configuration files',
            demandOption: false,
            default: true
        });
    }

    /**
     * Adds the 'composedir' option to the command line arguments.
     * This option is a string that specifies the path to a directory with user Compose configuration files.
     * It is not required and defaults to './overrides/'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static userComposeDirOption(yargs: Argv<{}>): void {
        yargs.option('composedir', {
            type: 'string',
            describe: 'Path to a directory with user Compose configuration files',
            demandOption: false,
            default: './overrides/'
        });
    }

    private static workDirOption(yargs: Argv<{}>): void {
        yargs.option('workdir', {
            type: 'string',
            describe: 'Path to the working directory for local node',
            demandOption: false,
            default: FileSystemUtils.getPlatformSpecificAppDataPath('hedera-local')
        });
    }

    /**
     * Adds the 'blocklist' option to the command line arguments.
     * This option is a boolean that enables or disables blocklisting of accounts.
     * It is not required and defaults to false.
     * The option can also be set using the alias 'b'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static blocklistingOption(yargs: Argv<{}>): void {
        yargs.option('blocklist', {
            alias: 'b',
            type: 'boolean',
            describe: 'Enable or disable blocklisting accounts',
            demandOption: false,
            default: false
        });
    }

    /**
     * Adds the 'verbose' option to the command line arguments.
     * This option is a string that sets the verbose level.
     * It is not required and defaults to 'info'.
     * The valid choices for this option are 'info' and 'trace'.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @public
     * @static
     */
    public static verboseLevelOption(yargs: Argv<{}>): void {
        yargs.option('verbose', {
            type: 'string',
            describe: 'Set the verbose level',
            demandOption: false,
            choices: ['silent', 'error', 'warning', 'info', 'debug', 'trace'],
            default: 'info',
        })
    }
    
    /**
     * Adds the 'enable-debug' option to the command line arguments.
     * This option is a boolean that enables or disables debugging of the local node.
     * It is not required and defaults to false.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static enableDebugOption(yargs: Argv<{}>): void {
        yargs.option('enable-debug', {
            type: 'boolean',
            describe: 'Enable or disable debugging of the local node',
            demandOption: false,
            default: false
          });
    }
    
    /**
     * Resolve the network type from a string.
     * @param {string} network - The network type as a string.
     * @returns {NetworkType} The network type.
     * @private
     */
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

    /**
     * Resolve the verbose level from a string.
     * @param {string} level - The verbose level as a string.
     * @returns {VerboseLevel} The verbose level.
     * @public
     */
    public static resolveVerboseLevel(level: string): VerboseLevel {
        switch (level) {
            case 'silent':
                return VerboseLevel.SILENT;
            case 'error':
                return VerboseLevel.ERROR;
            case 'warning':
                return VerboseLevel.WARNING;
            case 'info':
                return VerboseLevel.INFO;
            case 'debug':
                return VerboseLevel.DEBUG;
            case 'trace':
                return VerboseLevel.TRACE;
            default:
                return VerboseLevel.INFO;
        }
    }
}
