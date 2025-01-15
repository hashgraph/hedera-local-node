// SPDX-License-Identifier: Apache-2.0

import { IOBserver } from '../controller/IObserver';

/**
 * Represents the state of an entity.
 */
export interface IState {
    /**
     * Called when the state is started.
     * @returns {Promise<void>} A promise that resolves when the state has started.
     */
    onStart(): Promise<void>;

    /**
     * Subscribes an observer to the state.
     * @param {IOBserver} observer - The observer to subscribe.
     */
    subscribe(observer: IOBserver): void;
}
