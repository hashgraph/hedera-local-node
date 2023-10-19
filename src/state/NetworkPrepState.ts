import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class NetworkPrepState implements IState{
    private logger: LoggerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Initialization State Initialized!');
    }
    subscribe(observer: IOBserver): void {
        throw new Error('Method not implemented.');
    }

    onStart(): void {
        // do main action
        // in case of error go to onError
        // in case of finish go to onFinish
        throw new Error('Method not implemented.');
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
// this state waits for topics and uploads fees