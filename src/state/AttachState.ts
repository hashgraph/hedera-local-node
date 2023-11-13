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

import { CONSENSUS_NODE_LABEL, MIRROR_NODE_LABEL, RELAY_LABEL } from '../constants';
import { IOBserver } from '../controller/IObserver';
import { CLIService } from '../services/CLIService';
import { DockerService } from '../services/DockerService';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { IState } from './IState';
import stream from 'stream';

export class AttachState implements IState{
    private logger: LoggerService;

    private dockerService: DockerService;
    
    private observer: IOBserver | undefined;

    private stateName: string;
    
    constructor() {
        this.stateName = AttachState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.dockerService = ServiceLocator.Current.get<DockerService>(DockerService.name);
        this.logger.trace('Attach State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        const detached = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv().detached;
        if (detached) {
            this.observer!.update(EventType.Finish);
        }

        await this.attachContainerLogs(CONSENSUS_NODE_LABEL);
        await this.attachContainerLogs(MIRROR_NODE_LABEL)
        await this.attachContainerLogs(RELAY_LABEL);

        let i = 0;
        while (i++ < Number.MAX_VALUE) {
          await this.logger.updateStatusBoard();
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
    }

    private async attachContainerLogs(containerLabel: string) {
        const container = await this.dockerService.getContainer(containerLabel);
        const logger = this.logger;
        let logStream = new stream.PassThrough();
        logStream.on("data", function (chunk) {
          let line = chunk.toString("utf8");
          if (!line.includes(" Transaction ID: 0.0.2-")) {
            logger.attachTUI(line, containerLabel);
          }
        });
      
        container.logs(
          {
            follow: true,
            stdout: true,
            stderr: true,
            since: Date.now() / 1000,
          },
          function (err: any, stream: any) {
            if (err) {
              return console.error(err.message);
            }
            container.modem.demuxStream(stream, logStream, logStream);
            stream.on("end", function () {
              logStream.end("!stop!");
            });
          }
        );
    }
}
