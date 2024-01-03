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

/**
 * Class representing the local node errors.
 * @extends Error
 */
export class LocalNodeErrors extends Error {
    public message: string;
    public name: string;
  
    /**
     * Create a local node error.
     * @param {string} name - The name of the error.
     * @param {string} message - The message of the error.
     */
    constructor(name: string, message: string) {
      super();
      this.name = name;
      this.message = message;
    }

    /**
     * Check if the error is a connection error.
     * @returns {boolean} True if the error is a connection error, false otherwise.
     */
    public IS_CONNECTION_ERROR(): boolean {
        return this.name == "Connection Error";
    }


    /**
     * Check if the error is a client error.
     * @returns {boolean} True if the error is a client error, false otherwise.
     */
    public CLIENT_ERROR(): boolean {
        return this.name == "Client Error";
    }
}

/**
 * Object containing functions to create specific local node errors.
 */
export const Errors = {
    /**
     * Create a connection error.
     * @param {number} [port] - The port number.
     * @returns {LocalNodeErrors} The connection error.
     */
    CONNECTION_ERROR: (port?: number) => new LocalNodeErrors("Connection Error", `Something went wrong, while trying to connect ${port ? `to port ${port}` : `to local node`}`),

    /**
     * Create a client error.
     * @param {string} [msg] - The error message.
     * @returns {LocalNodeErrors} The client error.
     */
    CLEINT_ERROR: (msg?: string) => new LocalNodeErrors("Client Error", `Something went wrong, while trying to create SDK Client${msg ? `: ${msg}` : ``}`),
    
    /**
     * Create a no record file found error.
     * @returns {LocalNodeErrors} The no record file found error.
     */
    NO_RECORD_FILE_FOUND_ERROR: () => new LocalNodeErrors('No record file found Error', "This record file doesn't not exist, check if timestamp is correct and local-node was started in debug mode using --enable-debug option"),
    
    /**
     * Create an invalid timestamp error.
     * @returns {LocalNodeErrors} The invalid timestamp error.
     */
    INVALID_TIMESTAMP_ERROR: () => new LocalNodeErrors('Invalid Timestamp Error', 'Invalid timestamp string. Accepted formats are: 0000000000.000000000 and 0000000000-000000000'),
    
    /**
     * Create a debug mode check error.
     * @returns {LocalNodeErrors} The debug mode check error.
     */
    DEBUG_MODE_CHECK_ERROR: () => new LocalNodeErrors('Debug Mode check Error', 'Debug mode is not enabled to use this command. Please use the --enable-debug flag to enable it.'),
}
