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

import { NetworkConfiguration } from '../types/NetworkConfiguration';
import local from '../configuration/local.json';

/**
 * Class representing a configuration data.
 */
export class ConfigurationData {
    /**
     * Get the configuration data.
     * @returns {NetworkConfiguration} The configuration data.
     */
    public static getInstance(): NetworkConfiguration {
        const relayConfiguration = local?.envConfiguration ?? undefined;
        const nodeProperties = local?.nodeConfiguration!.properties ?? undefined;

        return {
            imageTagConfiguration: local.imageTagConfiguration,
            envConfiguration: relayConfiguration,
            nodeConfiguration: {
                properties: nodeProperties,
            }
        };
    }
}
