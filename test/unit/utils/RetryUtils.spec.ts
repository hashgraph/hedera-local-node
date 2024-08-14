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

import { createStubInstance, SinonSpy, SinonStubbedInstance, spy, stub } from 'sinon';
import { LoggerService } from '../../../src/services/LoggerService';
import { RetryUtils } from '../../../src/utils/RetryUtils';
import { expect } from 'chai';

describe('RetryUtils', () => {
  const backOff = 100;
  let doOnRetry: SinonSpy;
  let loggerService: SinonStubbedInstance<LoggerService>;

  beforeEach(() => {
    doOnRetry = spy((e) => loggerService.error(e.message));
    loggerService = createStubInstance(LoggerService);
  });

  afterEach(() => {
    doOnRetry.resetHistory();
  });

  it('should retry the task until it succeeds', async () => {
    const error = new Error('First attempt failed');
    const task = stub()
      .onFirstCall().rejects(error)
      .onSecondCall().resolves('Success');

    const result = await RetryUtils.retryTask(task, { doOnRetry, backOff });

    expect(result).to.equal('Success');
    expect(task.callCount).to.equal(2);
    expect(doOnRetry.callCount).to.equal(1);
    expect(loggerService.error.callCount).to.equal(1);
    expect(loggerService.error.getCall(0).args[0]).to.equal(error.message);
  });

  it('should throw an error after max retries', async () => {
    const error = new Error('Task failed');
    const task = stub().rejects(error);

    try {
      await RetryUtils.retryTask(task, { doOnRetry, backOff, maxRetries: 5 });
    } catch (e) {
      expect(e).to.equal(error);
    }

    expect(task.callCount).to.equal(5);
    expect(doOnRetry.callCount).to.equal(4);
  });

  it('should log an error message on each failure', async () => {
    const error = new Error('Task failed');
    const task = stub().rejects(error);

    try {
      await RetryUtils.retryTask(task, { doOnRetry, backOff });
    } catch (e) {
      expect(e).to.equal(error);
    }

    expect(task.callCount).to.equal(3);
    expect(doOnRetry.callCount).to.equal(2);
    expect(loggerService.error.callCount).to.equal(2);
    for (let i = 0; i < 2; i++) {
      expect(doOnRetry.getCall(i).args[0]).to.equal(error);
      expect(loggerService.error.getCall(i).args[0]).to.equal(error.message);
    }
  });

  it('should succeed on the first attempt without retries', async () => {
    const task = stub().resolves('Success');

    const result = await RetryUtils.retryTask(task, { doOnRetry, backOff });

    expect(result).to.equal('Success');
    expect(task.callCount).to.equal(1);
    expect(doOnRetry.callCount).to.equal(0);
    expect(loggerService.error.callCount).to.equal(0);
  });

  it('should not retry if shouldRetry returns false', async () => {
    const error = new Error('Non-retryable error');
    const task = stub().rejects(error);
    const shouldRetry = stub().returns(false);

    try {
      await RetryUtils.retryTask(task, { doOnRetry, backOff, shouldRetry });
    } catch (e) {
      expect(e).to.equal(error);
    }

    expect(task.callCount).to.equal(1);
    expect(doOnRetry.callCount).to.equal(0);
    expect(shouldRetry.callCount).to.equal(1);
  });

  it('should retry only for retryable errors', async () => {
    const retryableError = new Error('Retryable error');
    const nonRetryableError = new Error('Non-retryable error');
    const task = stub()
      .onFirstCall().rejects(retryableError)
      .onSecondCall().rejects(nonRetryableError);
    const shouldRetry = stub()
      .onFirstCall().returns(true)
      .onSecondCall().returns(false);

    try {
      await RetryUtils.retryTask(task, { doOnRetry, backOff, shouldRetry });
    } catch (e) {
      expect(e).to.equal(nonRetryableError);
    }

    expect(task.callCount).to.equal(2);
    expect(doOnRetry.callCount).to.equal(1);
    expect(shouldRetry.callCount).to.equal(2);
  });
});
