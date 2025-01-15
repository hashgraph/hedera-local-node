// SPDX-License-Identifier: Apache-2.0

import { EventType } from '../types/EventType';

/**
 * Interface representing an observer in the observer design pattern.
 */
export interface IOBserver {
    /**
     * Update method to be implemented by concrete observers.
     * @param {EventType} event - The event that the observer should react to.
     */
    update(event: EventType): void
}
