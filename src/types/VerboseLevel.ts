// SPDX-License-Identifier: Apache-2.0

/**
 * Represents the levels of verbosity that can be used.
 * 
 * @enum
 * @public
 * @property {VerboseLevel.INFO} INFO - Represents the info level of verbosity.
 * @property {VerboseLevel.TRACE} TRACE - Represents the trace level of verbosity.
 */
export enum VerboseLevel {
    SILENT, // Logs nothing.
    ERROR, // Logs only errors.
    WARNING, // Logs errors and warnings.
    INFO, // Logs errors, warnings, and informational messages.
    DEBUG, // Logs errors, warnings, informational messages, and debug information.
    TRACE, // Logs errors, warnings, informational messages, debug and trace messages.
}
