/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
