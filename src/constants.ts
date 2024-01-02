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

export const CONTAINERS = [
    {
        name: "Consensus Node",
        label: "network-node",
        port: 50211,
    },
    {
        name: "Mirror Node",
        label: "mirror-node-grpc",
        port: 5600,
    },
    {
        name: "Relay",
        label: "json-rpc-relay",
        port: 7546,
    },
];

export const CONSENSUS_NODE_LABEL = "network-node";
export const MIRROR_NODE_LABEL = "mirror-node-rest";
export const RELAY_LABEL = "json-rpc-relay";
export const IS_WINDOWS = process.platform === "win32";
export const UNKNOWN_VERSION = "Unknown";
export const NECESSARY_PORTS = [5551, 8545, 5600, 5433, 50211, 8082];
export const OPTIONAL_PORTS = [7546, 8080, 6379, 3000];
export const EVM_ADDRESSES_BLOCKLIST_FILE_RELATIVE_PATH = '../../compose-network/network-node'
export const RELATIVE_TMP_DIR_PATH = '../../src/services/record-parser/temp';
export const RELATIVE_RECORDS_DIR_PATH = '../../network-logs/node/recordStreams/record0.0.3';
export const APPLICATION_YML_RELATIVE_PATH = '../../compose-network/mirror-node/application.yml';
