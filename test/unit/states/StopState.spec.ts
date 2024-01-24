
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

import { expect } from 'chai';
import sinon from 'sinon';
import { StopState } from '../../../src/state/StopState';
import shell from 'shelljs';
import {
  DOCKER_CLEANING_VALUMES_MESSAGE,
  DOCKER_STOPPING_CONTAINERS_MESSAGE,
  STOP_STATE_INIT_MESSAGE,
  STOP_STATE_ON_START_MESSAGE,
  STOP_STATE_STOPPED_MESSAGE,
  STOP_STATE_STOPPING_MESSAGE
} from '../../../src/constants';
import path from 'path';
import { getTestBed } from '../testBed';
import { LoggerService } from '../../../src/services/LoggerService';

describe('StopState tests', () => {
    let stopState: StopState,
        testSandbox: sinon.SinonSandbox, 
        loggerService: sinon.SinonStubbedInstance<LoggerService>,
        serviceLocator: sinon.SinonStub<any[], any>;

    const TEST_DIR_MESSAGE = `Working dir is testDir`;
    const stateDir = path.resolve(__dirname, '../../../src/state');

    before(() => {
      let { sandbox, loggerServiceStub, serviceLocatorStub } = getTestBed({
        workDir: 'testDir',
      });

      testSandbox = sandbox
      loggerService = loggerServiceStub
      serviceLocator = serviceLocatorStub

      loggerServiceStub.trace.resetHistory();
      stopState = new StopState();
    });

    it('should initialize the Stop State', async () => {
        expect(stopState).to.be.instanceOf(StopState);
        testSandbox.assert.calledOnce(loggerService.trace);
        testSandbox.assert.calledWith(loggerService.trace, STOP_STATE_INIT_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(serviceLocator, 'LoggerService');
        testSandbox.assert.calledWith(serviceLocator, 'CLIService');
    })

    it('should have a subscribe method', async () => {
        expect(stopState.subscribe).to.be.a('function');
    })

    it('should execute onStart properly', async () => {
        const processStub = sinon.stub(process, 'cwd').returns('testDir');
        sinon.stub(process, 'platform').returns('test');
        const shellCDStub = sinon.stub(shell, 'cd');
        const shellExecStub = sinon.stub(shell, 'exec');
        stopState.onStart();

        // loggin messages
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_ON_START_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_STOPPING_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, DOCKER_STOPPING_CONTAINERS_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, DOCKER_CLEANING_VALUMES_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, TEST_DIR_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_STOPPED_MESSAGE, StopState.name);
        
        // shell commands: 'cd'
        testSandbox.assert.calledWith(shellCDStub, stateDir);
        testSandbox.assert.calledWith(shellCDStub, '../../');
        testSandbox.assert.calledWith(shellCDStub, 'testDir');
        testSandbox.assert.calledThrice(shellCDStub);

        // shell commands: 'exec'
        testSandbox.assert.calledWith(shellExecStub, 'docker compose kill --remove-orphans 2>/dev/null');
        testSandbox.assert.calledWith(shellExecStub, 'docker compose down -v --remove-orphans 2>/dev/null');
        testSandbox.assert.calledWith(shellExecStub, 'rm -rf network-logs/* >/dev/null 2>&1');
        testSandbox.assert.calledWith(shellExecStub, 'rm -rf "testDir/network-logs" >/dev/null 2>&1');
        testSandbox.assert.calledWith(shellExecStub, 'docker network prune -f 2>/dev/null');

        expect(processStub.calledOnce).to.be.true;
    })

});
