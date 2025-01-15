// SPDX-License-Identifier: Apache-2.0

import shell from 'shelljs';
import { IS_WINDOWS, NETWORK_PREFIX } from '../constants';

/**
 * Checks if the given string is a valid Docker network ID.
 * A valid Docker network ID is a 12-character hexadecimal string.
 *
 * @param {string} id - The string to be validated as a Docker network ID.
 * @returns {boolean} - Returns true if the string is a valid Docker network ID, false otherwise.
 *
 * @example
 * const id = "89ded1eca1d5";
 * console.log(isCorrectDockerId(id)); // Output: true
 *
 * @example
 * const invalidId = "invalidID123";
 * console.log(isCorrectDockerId(invalidId)); // Output: false
 */
const isCorrectDockerId = (id: string) => id.trim() !== '' && /^[a-f0-9]{12}$/.test(id);

/**
 * Provides utility methods for safe networks removal.
 */
export class SafeDockerNetworkRemover {
  /**
   * Removes all the networks started by docker compose. Only networks with the "hedera-" prefix will be affected.
   */
  public static removeAll() {
    const result = shell.exec(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`);
    if (!result || result.stderr !== '') {
      return;
    }
    result.stdout.split('\n').filter(isCorrectDockerId).forEach((id) => {
      shell.exec(`docker network rm ${id} -f 2>${IS_WINDOWS ? 'null' : '/dev/null'}`);
    });
  }
}
