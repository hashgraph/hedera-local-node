// SPDX-License-Identifier: Apache-2.0

export class RetryUtils {

  /**
   * Retries a task up to a specified number of times.
   *
   * @param {() => Promise<T>} task - The task to retry.
   * @param {Object} options - The options for the retry.
   * @param [options.maxAttempts=3] - The maximum number of attempts.
   * @param [options.backOff=500] - The time to wait between attempts in milliseconds.
   * @param [options.doOnRetry=(error, attempt) => {}] - The function to call on each retry.
   * @returns {Promise<T>} - A promise that resolves with the result of the task.
   * @template T
   */
  public static async retryTask<T>(
    task: () => Promise<T>,
    {
      maxRetries = 3,
      backOff = 500,
      shouldRetry = (_error: unknown) => true,
      doOnRetry = (_error: unknown) => {},
    }: {
      maxRetries?: number;
      backOff?: number;
      shouldRetry?: (error: unknown) => boolean;
      doOnRetry?: (error: unknown) => void;
    } = {}
  ): Promise<T> {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        // eslint-disable-next-line no-await-in-loop
        return await task();
      } catch (error) {
        if (!shouldRetry(error) || retries === maxRetries - 1) {
          throw error;
        }
        doOnRetry(error);
        await this.delay(backOff);
      }
      retries += 1;
    }
    /* istanbul ignore next */
    throw new Error('Unreachable code');
  }

  /**
   * Delays the execution of the task.
   * @param ms The time to wait in milliseconds.
   * @returns {Promise<void>} A promise that resolves after the delay.
   * @private
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
