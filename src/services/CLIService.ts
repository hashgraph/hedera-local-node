import { ArgumentsCamelCase, Argv, boolean } from 'yargs';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { NetworkType } from '../types/NetworkType';


export class CLIService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    private currentArgv: ArgumentsCamelCase<{}> | undefined;

    constructor() {
        this.serviceName = LoggerService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(this.serviceName);
        this.logger.trace('CLI Service Initialized!');
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
    }

    public loadDebugOptions(yargs: Argv<{}>): void {
        this.timestampOption(yargs);
    }

    public loadAccountOptions(yargs: Argv<{}>): void {
        this.accountOption(yargs);
        this.asyncOption(yargs);
        this.balanceOption(yargs);
    }

    public getCurrentArgv(){
        const accounts: number = this.currentArgv!.accounts as number || 10;
        const async: boolean = this.currentArgv!.async as boolean || true;
        const balance: number = this.currentArgv!.balance as number || 10000;
        const host: string = this.currentArgv!.host as string || '127.0.0.1';
        const network: NetworkType = this.resolveNetwork(this.currentArgv!.network as string || 'local');
        const limits: boolean = this.currentArgv!.limits as boolean || false;
        const devMode: boolean = this.currentArgv!.dev as boolean || false;
        const fullMode: boolean = this.currentArgv!.full as boolean || false;
        const multiNode: boolean = this.currentArgv!.multinode as boolean || false;
        const userCompose: boolean = this.currentArgv!.usercompose as boolean || true;
        const userComposeDir: string = this.currentArgv!.composedir as string || './overrides/';
        const blocklisting: boolean = this.currentArgv!.blocklist as boolean || false;

        const currentArgv: CLIOptions = {
            accounts,
            async,
            balance,
            host,
            network,
            limits,
            devMode,
            fullMode,
            multiNode,
            userCompose,
            userComposeDir,
            blocklisting
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
            demandOption: false
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
        console.log(network);
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