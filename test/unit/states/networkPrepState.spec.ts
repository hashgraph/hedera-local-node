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
import { NetworkPrepState } from '../../../src/state/NetworkPrepState';
import { getTestBed } from '../testBed';
import {
    NETWORK_PREP_STATE_IMPORT_FEES_END,
    NETWORK_PREP_STATE_INIT_MESSAGE,
    NETWORK_PREP_STATE_STARTING_MESSAGE,
    NETWORK_PREP_STATE_TOPIC_CREATED,
    NETWORK_PREP_STATE_WAITING_TOPIC_CREATION,
} from '../../../src/constants';
import { DockerService } from '../../../src/services/DockerService';
import { EventType } from '../../../src/types/EventType';
import { ClientService } from '../../../src/services/ClientService';

describe('NetworkPrepState tests', () => {
    let networkPrepState: NetworkPrepState,
        testSandbox: SinonSandbox, 
        loggerService: SinonStubbedInstance<LoggerService>,
        serviceLocator: SinonStub,
        dockerService: SinonStubbedInstance<DockerService>,
        observerSpy: SinonSpy,
        shellTestBed: {[key: string]: SinonStub};

    before(() => {
        const { 
            sandbox,
            loggerServiceStub,
            serviceLocatorStub,
            dockerServiceStub,
            shellStubs
        } = getTestBed({
            workDir: 'testDir',
        });
    
        testSandbox = sandbox
        dockerService = dockerServiceStub
        loggerService = loggerServiceStub
        serviceLocator = serviceLocatorStub
        shellTestBed = shellStubs

        networkPrepState = new NetworkPrepState();
        observerSpy = testSandbox.spy();
        const observer = {
            update: observerSpy
        }
        networkPrepState.subscribe(observer);
    });

    afterEach(() => {
        testSandbox.resetHistory();
        observerSpy.resetHistory();
        dockerService.tryDockerRecovery.reset()
    });

    it('should initialize the Network Prep State', async () => {
        expect(networkPrepState).to.be.instanceOf(NetworkPrepState);
        testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
        testSandbox.assert.calledWith(serviceLocator, ClientService.name);
        testSandbox.assert.calledOnce(loggerService.trace);
        testSandbox.assert.calledWith(loggerService.trace, NETWORK_PREP_STATE_INIT_MESSAGE, NetworkPrepState.name);
    })

    it('should have a subscribe method', async () => {
        expect(networkPrepState.subscribe).to.be.a('function');
    })

    it('should have a onStart method', async () => {
        expect(networkPrepState.onStart).to.be.a('function');
    })
    
    describe('onStart', () => {
        let importStub: SinonStub, topicStub: SinonStub;

        before(async () => {
            importStub = testSandbox.stub(networkPrepState as any, 'importFees').resolves();
            topicStub = testSandbox.stub(networkPrepState as any, 'waitForTopicCreation').resolves();
        })

        after(() => {
            importStub.restore();
            topicStub.restore();
        })

        beforeEach(async () => {
            await networkPrepState.onStart();
        })

        it('should execute and log into LoggerService', async () => {
            testSandbox.assert.calledOnce(loggerService.info);
            testSandbox.assert.calledWith(loggerService.info, NETWORK_PREP_STATE_STARTING_MESSAGE, NetworkPrepState.name);
        })

        it('should execute and fire an event into observer', async () => {
            testSandbox.assert.calledWith(observerSpy, EventType.Finish);
        })

        it('should execute and call "importFees" function', async () => {
            testSandbox.assert.calledOnce(importStub);
        })

        it('should execute and call "importFees" function', async () => {
            testSandbox.assert.calledOnce(importStub);
        })
    })

    describe('importFees', () => {
        let topicStub: SinonStub,
            buildQueryFeesStub: SinonStub;

        before(async () => {
            class MockFileContentsQuery {
                setFileId() {
                    return this
                }
                execute() {
                    return Promise.resolve('test')
                }
            }
            topicStub = testSandbox.stub(networkPrepState as any, 'waitForTopicCreation').resolves();
            buildQueryFeesStub = testSandbox.stub(networkPrepState as any, 'buildQueryFees').returns(new MockFileContentsQuery);
        })

        after(() => {
            topicStub.restore();
        })

        beforeEach(async () => {
            await networkPrepState.onStart();
        })

        it('should execute and log into LoggerService', async () => {
            testSandbox.assert.calledTwice(loggerService.info);
            testSandbox.assert.calledWith(loggerService.info, NETWORK_PREP_STATE_STARTING_MESSAGE, NetworkPrepState.name);
            testSandbox.assert.calledWith(loggerService.info, NETWORK_PREP_STATE_IMPORT_FEES_END, NetworkPrepState.name);
        })

        it('should execute and call shell.exec', async () => {
            const { shellExecStub } = shellTestBed;
            testSandbox.assert.calledTwice(shellExecStub);
        })

        it('should execute and call "buildQueryFees" function', async () => {
            testSandbox.assert.calledTwice(buildQueryFeesStub);
        })

        it('should execute and call "getNullOutput" function', async () => {
            testSandbox.assert.calledOnce(dockerService.getNullOutput);
        })

    })

    describe('waitForTopicCreation', () => {
        let importStub: SinonStub,
            shellTestBedExec: SinonStub,
            destroyFake: SinonSpy<any[], any>,
            killFake: SinonSpy<any[], any>;

        before(async () => {
            importStub = testSandbox.stub(networkPrepState as any, 'importFees').resolves();
            const { shellExecStub } = shellTestBed;
            shellTestBedExec = shellExecStub;
            destroyFake = testSandbox.fake();
            killFake = testSandbox.fake();
            shellTestBedExec.returns({
                stdout: {
                    on: testSandbox.fake.yields(
                        "Created TOPIC entity: 0.0.111",
                    ),
                    destroy: destroyFake
                },
                kill: killFake
            })
        })

        after(() => {
            importStub.restore();
        })

        beforeEach(async () => {
            await networkPrepState.onStart();
        })

        it('should execute and log into LoggerService', async () => {
            testSandbox.assert.calledTwice(loggerService.info);
            testSandbox.assert.calledOnce(loggerService.trace);
            testSandbox.assert.calledWith(loggerService.trace, NETWORK_PREP_STATE_WAITING_TOPIC_CREATION, NetworkPrepState.name);
            testSandbox.assert.calledWith(loggerService.info, NETWORK_PREP_STATE_TOPIC_CREATED, NetworkPrepState.name);
        })

        it('should execute and call shell.exec', async () => {
            testSandbox.assert.calledOnceWithExactly(
                shellTestBedExec,
                'docker logs mirror-node-monitor -f',
                { silent: true, async: true }
            );
            testSandbox.assert.calledOnce(destroyFake);
            testSandbox.assert.calledOnce(killFake);
        })
    })
});
