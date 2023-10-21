import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class StopState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Stop State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        throw new Error('Method not implemented.');
    }
}
// this state attempts to stop the network and return to original state