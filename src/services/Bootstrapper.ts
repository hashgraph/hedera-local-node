// SPDX-License-Identifier: Apache-2.0


import yargs from 'yargs';
import { CLIService } from './CLIService';
import { ClientService } from './ClientService';
import { ConnectionService } from './ConnectionService';
import { DockerService } from './DockerService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';

/**
 * Class responsible for initializing the application.
 */
export class Bootstrapper {
    /**
     * Initializes all the services and registers them in the service locator.
     * @param {yargs.ArgumentsCamelCase<{}>} argv - The command line arguments.
     */
    public static initialize(argv: yargs.ArgumentsCamelCase<{}>): void {
        const verbose = CLIService.resolveVerboseLevel(argv.verbose as string)
        ServiceLocator.Current.register(new LoggerService(verbose));
        ServiceLocator.Current.register(new CLIService(argv));
        ServiceLocator.Current.register(new DockerService());
        ServiceLocator.Current.register(new ConnectionService());
        ServiceLocator.Current.register(new ClientService());
    }
}
