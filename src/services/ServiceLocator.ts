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

/**
 * ServiceLocator is a class that manages services in the application.
 * It provides methods to register, unregister, and get services.
 * It implements the Singleton pattern, meaning there can only be one instance of this class in the application.
 */
export class ServiceLocator {
    /**
     * A map of services registered with the service locator.
     * The key is the service name and the value is the service instance.
     * 
     * @private
     */
    private services: Map<string,IService> = new Map<string, IService>();

    /**
     * The current instance of the service locator.
     * 
     * @private
     */
    private static currentInstance: ServiceLocator;

    /**
     * Gets the current instance of the ServiceLocator.
     * If the current instance does not exist, it creates a new one.
     * 
     * @public
     * @returns {ServiceLocator} The current instance of the ServiceLocator.
     */
    public static get Current(): ServiceLocator {
        if (!ServiceLocator.currentInstance) {
            this.currentInstance = new ServiceLocator();
        }
        
        return this.currentInstance
    }

    /**
     * Gets a service registered with the service locator.
     * 
     * @param {string} serviceName - The name of the service to get.
     * @returns {T} The service instance.
     * @throws {Error} If the service is not registered with the service locator.
     */
    public get<T extends IService>(serviceName: string): T {
        if (!this.services.has(serviceName)) {
          throw new Error(`${serviceName} not registered with ${this.constructor.name}`);
        }
    
        return this.services.get(serviceName) as T;
    }

    /**
     * Registers a service with the service locator.
     * 
     * @param {T} service - The service instance to register.
     * @throws {Error} If the service is already registered with the service locator.
     */
    public register<T extends IService>(service: T): void {
        const key: string = service.constructor.name;
        if (this.services.has(key)) {
            throw new Error(`${key} not registered with ${this.constructor.name}`);
        }

        this.services.set(key, service);
    }

    /**
     * Unregisters a service from the service locator.
     * 
     * @public
     * @param {string} serviceName - The name of the service to unregister.
     */
    public unregister(serviceName: string): void {
        if (!this.services.has(serviceName)) {
            console.error(`Attempted to unregister service of type ${serviceName} which is not registered with ${this.constructor.name}.`);
            return;
        }

        this.services.delete(serviceName);
    }
}
