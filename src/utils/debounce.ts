// SPDX-License-Identifier: Apache-2.0

/**
 * Limit the execution of a function to once every N ms
 */
const debounce = <F extends (...args: any[]) => void>(func: F, delay: number) => {
    let timerActive = false;
    return (...args: any) => {
        if (!timerActive) {
            timerActive = true;
            func(...args);
            setTimeout(() => {
                timerActive = false;
            }, delay);
        }
    };
};

export default debounce;