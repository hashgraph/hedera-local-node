import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';


export class AccountService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    constructor() {
        this.serviceName = LoggerService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(this.serviceName);
        this.logger.trace('Account Service Initialized!');
    }

    public number(): number {
        return 5;
    }
}