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

import { NetworkConfiguration } from '../types/NetworkConfiguration';
import { NetworkType } from '../types/NetworkType';
import local from '../configuration/local.json';
import mainnet from '../configuration/mainnet.json';
import testnet from '../configuration/testnet.json';
import previewnet from '../configuration/previewnet.json';

/**
 * Class representing a configuration data.
 */
export class ConfigurationData {
    /**
     * Get the selected configuration data based on the network type.
     * @param {NetworkType} network - The type of the network.
     * @returns {NetworkConfiguration} The configuration data for the selected network.
     */
    public getSelectedConfigurationData(network: NetworkType): NetworkConfiguration {
        switch (network) {
            case NetworkType.LOCAL:
                return this.getNetworkConfiguration(local as any);
            case NetworkType.MAINNET:
                return this.getNetworkConfiguration(mainnet as any);
            case NetworkType.TESTNET:
                return this.getNetworkConfiguration(testnet as any);
            case NetworkType.PREVIEWNET:
                return this.getNetworkConfiguration(previewnet as any);
            default:
                return this.getNetworkConfiguration(local as any);
        }
    }

    /**
     * Get the network configuration from the JSON configuration.
     * @param {NetworkConfiguration} jsonConfiguration - The JSON configuration.
     * @returns The network configuration.
     */
    private getNetworkConfiguration(jsonConfiguration: NetworkConfiguration): NetworkConfiguration {
        const relayConfiguration = jsonConfiguration?.envConfiguration ?? undefined;
        const nodeProperties = jsonConfiguration?.nodeConfiguration!.properties ?? undefined;
        const configuration: NetworkConfiguration = {
            imageTagConfiguration: jsonConfiguration.imageTagConfiguration,
            envConfiguration: relayConfiguration,
            nodeConfiguration: {
                properties: nodeProperties,
            }
        };

        return configuration;
    }
}
