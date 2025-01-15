// SPDX-License-Identifier: Apache-2.0

import yargs, { ArgumentsCamelCase, Argv } from 'yargs';
import { IService } from './IService';
import { CLIOptions } from '../types/CLIOptions';
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
        CLIService.hostOption(yargs);
        CLIService.rateLimitOption(yargs);
        CLIService.devModeOption(yargs);
        CLIService.fullModeOption(yargs);
        CLIService.multiNodeOption(yargs);
        CLIService.userComposeOption(yargs);
        CLIService.userComposeDirOption(yargs);
        CLIService.blocklistingOption(yargs);
        CLIService.selectNetworkTag(yargs);
        CLIService.selectMirrorTag(yargs);
        CLIService.selectRelayTag(yargs);
        CLIService.createInitialResources(yargs);
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
        const host = argv.host as string;
        const limits = argv.limits as boolean;
        const devMode = argv.dev as boolean;
        const fullMode = argv.full as boolean;
        const multiNode = argv.multinode as boolean;
        const userCompose = argv.usercompose as boolean;
        const userComposeDir = argv.composedir as string;
        const blocklisting = argv.blocklist as boolean;
        const startup = argv.startup as boolean;
        const verbose = CLIService.resolveVerboseLevel(argv.verbose as string);
        const networkTag = argv.networkTag as string;
        const mirrorTag = argv.mirrorTag as string;
        const relayTag = argv.relayTag as string;
        const workDir = FileSystemUtils.parseWorkDir(argv.workdir as string);
        const createInitialResources = argv.createInitialResources as boolean;
        const persistTransactionBytes = argv.persistTransactionBytes as boolean;
        const currentArgv: CLIOptions = {
            accounts,
            async,
            balance,
            host,
            limits,
            devMode,
            fullMode,
            multiNode,
            userCompose,
            userComposeDir,
            blocklisting,
            startup,
            verbose,
            networkTag,
            mirrorTag,
            relayTag,
            workDir,
            createInitialResources,
            persistTransactionBytes,
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
     * Adds the 'network-tag' option to the command line arguments.
     * This option is a string that enables usage of custom network tag.
     * It is not required and defaults to predefined configuration.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static selectNetworkTag(yargs: Argv<{}>): void {
        yargs.option('network-tag', {
            type: 'string',
            describe: 'Select custom network node tag',
            demandOption: false,
            default: ''
        });
    }

    /**
     * Adds the 'mirror-tag' option to the command line arguments.
     * This option is a string that enables usage of custom mirror-node tag.
     * It is not required and defaults to predefined configuration.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static selectMirrorTag(yargs: Argv<{}>): void {
        yargs.option('mirror-tag', {
            type: 'string',
            describe: 'Select custom mirror-node tag',
            demandOption: false,
            default: ''
        });
    }

    /**
     * Adds the 'mirror-tag' option to the command line arguments.
     * This option is a string that enables usage of custom mirror-node tag.
     * It is not required and defaults to predefined configuration.
     * 
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static selectRelayTag(yargs: Argv<{}>): void {
        yargs.option('relay-tag', {
            type: 'string',
            describe: 'Select custom hedera-json-rpc relay tag',
            demandOption: false,
            default: ''
        });
    }

    /**
     * Adds the 'create-initial-resources' option to the command line arguments.
     * This option is a boolean that enables or disables creation of initial resources.
     * It is not required and defaults to false.
     *
     * @param {yargs.Argv<{}>} yargs - The yargs instance to which the option is added.
     * @private
     * @static
     */
    private static createInitialResources(yargs: Argv<{}>): void {
        yargs.option('create-initial-resources', {
            type: 'boolean',
            describe: 'Enable or disable creation of initial resources',
            demandOption: false,
            default: false
        });
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
