// SPDX-License-Identifier: Apache-2.0

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
        return local;
    }
}
