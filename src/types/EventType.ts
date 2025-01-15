// SPDX-License-Identifier: Apache-2.0

/**
 * Represents the types of events that can occur in the application.
 * 
 * @enum
 * @public
 * @property {EventType.Finish} Finish - Represents the finish event.
 * @property {EventType.DockerError} DockerError - Represents a Docker error event.
 * @property {EventType.UnknownError} UnknownError - Represents an unknown error event.
 */
export enum EventType{
    Finish,
    DockerError,
    UnknownError,
    UnresolvableError
}
