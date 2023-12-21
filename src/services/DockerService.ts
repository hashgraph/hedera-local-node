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

import Dockerode from 'dockerode';
import shell from 'shelljs';
import semver from'semver';
import { IS_WINDOWS, NECESSARY_PORTS, UNKNOWN_VERSION, OPTIONAL_PORTS } from '../constants';
import { IService } from './IService';
import { LoggerService } from './LoggerService';
import { ServiceLocator } from './ServiceLocator';
import detectPort from 'detect-port';

export class DockerService implements IService{
    private logger: LoggerService;

    private serviceName: string;

    private dockerSocket: string;

    constructor() {
        this.serviceName = DockerService.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Docker Service Initialized!', this.serviceName);

        const defaultSocketPath = IS_WINDOWS
        ? '//./pipe/docker_engine'
        : '/var/run/docker.sock';

        this.dockerSocket = process.env.DOCKER_SOCKET || defaultSocketPath;
    }

    public getDockerSocket(): string {
        return this.dockerSocket;
    }

    public getNullOutput () {
        if (IS_WINDOWS) return 'null';
        return '/dev/null';
    }

    public async checkDocker (): Promise<boolean> {
        let isRunning = false;
    
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        await docker
          .info()
          .then(() => {
            this.logger.trace('Docker is running.', this.serviceName);
            isRunning = true;
          })
          .catch(() => {
            this.logger.error('Docker is not running.', this.serviceName);
            isRunning = false;
          });
        return isRunning;
    }

    public async isPortInUse (portsToCheck: number[]): Promise<void> {
      const promises: Promise<boolean>[] = portsToCheck.map((port:number) => detectPort(port)
        .then((available: number) => available !== port)
        .catch((error: Error) => {
          // Handle the error
          throw error;
        }));

      const resolvedPromises: boolean[] = await Promise.all(promises);
      resolvedPromises.forEach((result, index) => {
        const port = portsToCheck[index];
        if (result && OPTIONAL_PORTS.includes(port)) {
          this.logger.info(`Port ${port} is in use.`, this.serviceName); 
        } else if (result && NECESSARY_PORTS.includes(port)) {
          this.logger.error(`Port ${port} is in use.`, this.serviceName); 
        }
      });

      const resolvedPromisesNecessaryPortsOnly = resolvedPromises.slice(0, NECESSARY_PORTS.length);

      if(!(resolvedPromisesNecessaryPortsOnly.every(value => value === false))) {
        this.logger.error('Node cannot start properly because necessary ports are in use', this.serviceName);
        process.exit(1);
      }
    }

    public async isCorrectDockerComposeVersion (): Promise<boolean> {
        this.logger.trace('Checking docker compose version...', this.serviceName);
        // We are executing both commands because in Linux we may have docker-compose v2, so we need to check both
        const resultFirstCommand = await shell.exec(
          'docker compose version --short',
          { silent: true }
        );
        const resultSecondCommand = await shell.exec(
          'docker-compose version --short',
          { silent: true }
        );
    
        // Exit code is 127 when no docker installation is found
        if (resultFirstCommand.code === 127 && resultSecondCommand.code === 127) {
            this.logger.error('Please install docker compose V2.', this.serviceName);
        } else if (
          resultFirstCommand.code === 127 &&
          resultSecondCommand.code === 0
        ) {
            this.logger.error(
            'Looks like you have docker-compose V1, but you need docker compose V2',
            this.serviceName
          );
        } else {
          const version = resultFirstCommand.stdout
            ? resultFirstCommand.stdout
            : resultSecondCommand.stdout;
          if (semver.gt(version, '2.12.2')) {
            // Docker version is OK
            return true;
          }
          this.logger.error(
            'You are using docker compose version prior to 2.12.2, please upgrade',
            this.serviceName
          );
        }
        return false;
    }
    
    public async getContainer(containerLabel: string) {
      const containerId = await this.getContainerId(containerLabel) as string;
      const docker = new Dockerode({
        socketPath: this.getDockerSocket(),
      });
      return docker.getContainer(containerId);
    }

    public async getContainerId (name: string) {
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        const opts = {
          limit: 1,
          filters: { name: [`${name}`] }
        };
    
        return new Promise((resolve, reject) => {
          docker.listContainers(opts, (err, containers) => {
            if (err) {
              reject(err);
            } else {
              resolve(containers![0].Id);
            }
          });
        });
    }
    
    public async getContainerVersion (name: string) {
        const docker = new Dockerode({ socketPath: this.dockerSocket });
        const opts = {
          limit: 1,
          filters: { name: [`${name}`] }
        };
    
        return new Promise((resolve, reject) => {
          docker.listContainers(opts, (err, containers) => {
            if (err) {
              reject(err);
            } else {
              try {
                resolve(containers![0].Image.split(':')[1]);
              } catch (e) {
                resolve(UNKNOWN_VERSION);
              }
            }
          });
        });
    }
}
