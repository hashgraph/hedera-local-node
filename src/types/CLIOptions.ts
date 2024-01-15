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

import { NetworkType } from "./NetworkType";

/**
 * Represents the options that can be passed to the CLI.
 * 
 * @interface
 * @public
 * @property {number} accounts - The number of accounts to be created.
 * @property {boolean} async - Whether to run commands asynchronously.
 * @property {number} balance - The balance for the accounts.
 * @property {boolean} detached - Whether to run in detached mode.
 * @property {string} host - The host address.
 * @property {NetworkType} network - The type of the network.
 * @property {boolean} limits - Whether to impose limits.
 * @property {boolean} devMode - Whether to run in development mode.
 * @property {boolean} fullMode - Whether to run in full mode.
 * @property {boolean} multiNode - Whether to run in multi-node mode.
 * @property {boolean} userCompose - Whether to use user compose.
 * @property {string} userComposeDir - The directory of the user compose file.
 * @property {boolean} blocklisting - Whether to enable blocklisting.
 * @property {boolean} startup - Whether to start up.
 * @property {number} verbose - The level of verbosity.
 * @property {string} timestamp - The timestamp for debugging.
 * @property {boolean} enableDebug - Whether to enable debugging.
 */
export interface CLIOptions {
    accounts: number,
    async: boolean,
    balance: number,
    detached: boolean,
    host: string,
    network: NetworkType,
    limits: boolean,
    devMode: boolean,
    fullMode: boolean,
    multiNode: boolean,
    userCompose: boolean,
    userComposeDir: string,
    blocklisting: boolean,
    startup: boolean,
    verbose: number,
    timestamp: string,
    enableDebug: boolean,
    workDir: string,
}
