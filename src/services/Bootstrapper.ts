import { AccountService } from './AccountService';
import { CLIService } from './CLIService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';

export class Bootstrapper {
    public static async Initiailze(): Promise<void> {
        ServiceLocator.Initiailze();

        ServiceLocator.Current.register(new LoggerService());
        ServiceLocator.Current.register(new CLIService());
        ServiceLocator.Current.register(new AccountService());
    }
}