/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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
import { SinonSandbox, SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';
import { LoggerService } from '../../../src/services/LoggerService';
import { RecoveryState } from '../../../src/state/RecoveryState';
import { getTestBed } from '../testBed';
import {
    RECOVERY_STATE_INIT_MESSAGE,
    RECOVERY_STATE_STARTING_MESSAGE,
} from '../../../src/constants';
import { DockerService } from '../../../src/services/DockerService';
import { EventType } from '../../../src/types/EventType';

describe('RecoveryState tests', () => {
    let recoveryState: RecoveryState,
        testSandbox: SinonSandbox, 
        loggerService: SinonStubbedInstance<LoggerService>,
        serviceLocator: SinonStub,
        dockerService: SinonStubbedInstance<DockerService>,
        observerSpy: SinonSpy;

    before(() => {
        const { 
            sandbox,
            loggerServiceStub,
            serviceLocatorStub,
            dockerServiceStub,
        } = getTestBed({
            workDir: 'testDir',
        });
    
        testSandbox = sandbox
        dockerService = dockerServiceStub
        loggerService = loggerServiceStub
        serviceLocator = serviceLocatorStub

        recoveryState = new RecoveryState(EventType.DockerError);
        observerSpy = testSandbox.spy();
        const observer = {
            update: observerSpy
        }
        recoveryState.subscribe(observer);
    });

    afterEach(() => {
        testSandbox.resetHistory();
        observerSpy.resetHistory();
        dockerService.tryDockerRecovery.reset()
    });

    it('should initialize the Recovery State', async () => {
        expect(recoveryState).to.be.instanceOf(RecoveryState);
        testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
        testSandbox.assert.calledWith(serviceLocator, DockerService.name);
        testSandbox.assert.calledOnce(loggerService.trace);
        testSandbox.assert.calledWith(loggerService.trace, RECOVERY_STATE_INIT_MESSAGE, RecoveryState.name);
    })

    it('should have a subscribe method', async () => {
        expect(recoveryState.subscribe).to.be.a('function');
    })

    it('should execute onStart with EventType: DockerError', async () => {
        await recoveryState.onStart();

        // loggin messages
        testSandbox.assert.calledOnce(loggerService.info)
        testSandbox.assert.calledWith(loggerService.info, RECOVERY_STATE_STARTING_MESSAGE, RecoveryState.name);

        testSandbox.assert.calledWith(observerSpy, EventType.UnknownError);

        testSandbox.assert.calledOnceWithExactly(dockerService.tryDockerRecovery, RecoveryState.name);
    })
});
