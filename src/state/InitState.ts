import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { CLIOptions } from '../types/CLIOptions';
import { IOBserver } from '../controller/IObserver';
import { EventType } from '../types/EventType';

export class InitState implements IState{
    private logger: LoggerService;
    private observer: IOBserver | undefined;
    private cliOptions: CLIOptions;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace('Initialization State Initialized!');
    }

    subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        this.logger.trace('Initialization State Starting...');
        // do main action
        // in case of error go to onError
        // in case of finish go to onFinish
        this.observer!.update(EventType.Finish);
    }

    onError(): void {
        // log last things and call onError event
        throw new Error('Method not implemented.');
    }

    onFinish(): void {
        // log last things and call onFinish event
        throw new Error('Method not implemented.');
    }
}
//this state loads all configurations and files