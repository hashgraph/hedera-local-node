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

import pino, { Logger } from 'pino';
import { IService } from './IService';

export class LoggerService implements IService{

    private logger: Logger;

    constructor() {
        this.logger = pino({
            name: 'hedera-local-node',
            level: process.env.LOG_LEVEL || 'trace',
            transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: true,
                },
              },
          });
        this.logger.trace('Logger Service Initialized!');
    }

    public info(msg: string): void {
        this.logger.info(msg);
    }

    public debug(msg: string): void {
        this.logger.debug(msg);
    }

    public trace(msg: string): void {
        this.logger.trace(msg);
    }

    public error(msg: string): void {
        this.logger.error(msg);
    }
}
