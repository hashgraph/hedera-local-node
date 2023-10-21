import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class NetworkPrepState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Initialization State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        // do main action
        // in case of error go to onError
        // in case of finish go to onFinish
        throw new Error('Method not implemented.');
    }
}
// this state waits for topics and uploads fees