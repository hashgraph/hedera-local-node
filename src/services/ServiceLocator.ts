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

export class ServiceLocator {
    private services: Map<string,IService> = new Map<string, IService>();

    public static Current: ServiceLocator;

    public static Initiailze(): void {
        this.Current = new ServiceLocator();
    }

    public get<T extends IService>(serviceName: string): T {
        if (!this.services.has(serviceName)) {
          throw new Error(`${serviceName} not registered with ${this.constructor.name}`);
        }
    
        return this.services.get(serviceName) as T;
    }

    public register<T extends IService>(service: T): void {
        const key: string = service.constructor.name;
        if (this.services.has(key)) {
            throw new Error(`${key} not registered with ${this.constructor.name}`);
        }

        this.services.set(key, service);
    }

    public unregister(serviceName: string): void {
        if (!this.services.has(serviceName)) {
            console.error(`Attempted to unregister service of type ${serviceName} which is not registered with ${this.constructor.name}.`);
            return;
        }

        this.services.delete(serviceName);
    }
}
