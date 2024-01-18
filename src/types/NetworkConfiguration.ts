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

/**
 * Represents the configuration of a network.
 * 
 * @interface
 * @public
 * @property {Array<Configuration>} imageTagConfiguration - The configuration for the image tags.
 * @property {Array<Configuration>} [envConfiguration] - The configuration for the environment variables.
 * @property {NodeConfiguration} [nodeConfiguration] - The configuration for the nodes.
 */
export interface NetworkConfiguration {
    imageTagConfiguration: Array<Configuration>,
    envConfiguration?: Array<Configuration>,
    nodeConfiguration?: NodeConfiguration,
}

/**
 * Represents the configuration of a node.
 * 
 * @interface
 * @public
 * @property {Array<Configuration>} properties - The properties of the node.
 */
export interface NodeConfiguration {
    properties: Array<Configuration>,
}

/**
 * Represents a configuration entry.
 * 
 * @interface
 * @public
 * @property {string} key - The key of the configuration entry.
 * @property {any} value - The value of the configuration entry.
 */
export interface Configuration {
    key: string,
    value: any
}
