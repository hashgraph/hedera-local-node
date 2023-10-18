import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';

export class StartState implements IState{
    private logger: LoggerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Start State Initialized!');
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