import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class StartState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Start State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        throw new Error('Method not implemented.');
    }
}
// this changes attempts to start the network