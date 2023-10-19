import { IOBserver } from '../controller/IObserver';
import { CLIService } from '../services/CLIService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { CLIOptions } from '../types/CLIOptions';
import { IState } from './IState';

export class ConfigurationState implements IState{
    private logger: LoggerService;
    private observer: IOBserver | undefined;
    private cliOptions: CLIOptions;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace('Configuration State Initialized!');
    }
    
    subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        this.logger.trace('Configuration State Starting...');
        this.logger.info(`Setting configuration for ${this.cliOptions.network} network with latest images on host ${this.cliOptions.host} with dev mode turned ${this.cliOptions.devMode ? "on" : "off"} using ${this.cliOptions.fullMode? "full": "turbo"} mode in ${this.cliOptions.multiNode? "multi" : "single"} node configuration...`);

        this.logger.info(`Configuration was set succesfully.`)
        throw new Error('Method not implemented.');
    }

    onError(): void {
        throw new Error('Method not implemented.');
    }

    onFinish(): void {
        throw new Error('Method not implemented.');
    }
}
//this state changes all settings and files based on configurations