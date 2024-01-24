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
