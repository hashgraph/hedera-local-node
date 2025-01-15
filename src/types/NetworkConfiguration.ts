// SPDX-License-Identifier: Apache-2.0

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
