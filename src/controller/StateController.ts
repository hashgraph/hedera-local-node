import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';

export class StateController {
    private logger: LoggerService;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('State Controller Initialized!');
    }
}