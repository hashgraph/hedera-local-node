import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class InitState implements IState{
    private logger: LoggerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Initialization State Initialized!');
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
