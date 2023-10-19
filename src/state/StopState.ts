import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class StopState implements IState{
    private logger: LoggerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Stop State Initialized!');
    }

    subscribe(observer: IOBserver): void {
        throw new Error('Method not implemented.');
    }

    onStart(): void {
        throw new Error('Method not implemented.');
    }

    onError(): void {
        throw new Error('Method not implemented.');
    }

    onFinish(): void {
        throw new Error('Method not implemented.');
    }
}
// this state attempts to stop the network