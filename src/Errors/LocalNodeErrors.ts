// SPDX-License-Identifier: Apache-2.0

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
}
