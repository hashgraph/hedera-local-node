/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
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

import { IService } from './IService';

export class LoggerService implements IService{

    private logger: any;
    
    private serviceName: string;

    constructor() {
        this.serviceName = LoggerService.name;
        this.logger = console;
        this.logger.log('Logger Service Initialized!', this.serviceName);
    }

    public trace(msg: string, module: string = ''): void {
        this.logger.log(`[Hedera-Local-Node]\x1b[37m TRACE \x1b[0m(${module}) ${msg}`);
    }

    public info(msg: string, module: string = ''): void {
        this.logger.log(`[Hedera-Local-Node]\x1b[32m INFO \x1b[0m(${module}) ${msg}`);
    }

    public error(msg: string, module: string = ''): void {
        this.logger.error(`[Hedera-Local-Node]\x1b[31m ERROR \x1b[0m(${module}) ${msg}`);
    }

    public emptyLine(): void{
        this.logger.log('');
    }
}
