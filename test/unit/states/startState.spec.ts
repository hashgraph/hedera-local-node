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
import { resolve } from 'path';
import { ShellString } from 'shelljs';
import { SinonSandbox, SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';
import { LocalNodeErrors } from '../../../src/Errors/LocalNodeErrors';
import {
    START_STATE_INIT_MESSAGE,
    START_STATE_STARTED_DETECTING,
    START_STATE_STARTED_MESSAGE,
    START_STATE_STARTING_MESSAGE
} from '../../../src/constants';
import { ConnectionService } from '../../../src/services/ConnectionService';
import { DockerService } from '../../../src/services/DockerService';
import { LoggerService } from '../../../src/services/LoggerService';
import { StartState } from '../../../src/state/StartState';
import { EventType } from '../../../src/types/EventType';
import { getTestBed } from '../testBed';

describe('StartState tests', () => {
    let startState: StartState,
        testSandbox: SinonSandbox, 
        loggerService: SinonStubbedInstance<LoggerService>,
        serviceLocator: SinonStub,
        dockerService: SinonStubbedInstance<DockerService>,
        stateDir: string,
        processTestBed: {[key: string]: SinonStub},
        shellTestBed: {[key: string]: SinonStub},
        observerSpy: SinonSpy,
        connectionService: SinonStubbedInstance<ConnectionService>;

    before(() => {
        const { 
            sandbox,
            loggerServiceStub,
            serviceLocatorStub,
            proccesStubs,
            shellStubs,
            dockerServiceStub,
            connectionServiceStub
        } = getTestBed({
            workDir: 'testDir',
        });
        stateDir = resolve(__dirname, '../../../src/state');
    
        testSandbox = sandbox
        dockerService = dockerServiceStub
        loggerService = loggerServiceStub
        serviceLocator = serviceLocatorStub
        processTestBed = proccesStubs
        shellTestBed = shellStubs
        connectionService = connectionServiceStub

        startState = new StartState();
        observerSpy = testSandbox.spy();
        const observer = {
            update: observerSpy
        }
        startState.subscribe(observer);
    });

    afterEach(() => {
        testSandbox.resetHistory();
        observerSpy.resetHistory();
        dockerService.dockerComposeUp.reset();
    });

    it('should initialize the Start State', async () => {
        expect(startState).to.be.instanceOf(StartState);
        testSandbox.assert.calledWith(serviceLocator, 'LoggerService');
        testSandbox.assert.calledWith(serviceLocator, 'CLIService');
        testSandbox.assert.calledWith(serviceLocator, 'DockerService');
        testSandbox.assert.calledWith(serviceLocator, 'ConnectionService');
        testSandbox.assert.calledOnce(loggerService.trace);
        testSandbox.assert.calledWith(loggerService.trace, START_STATE_INIT_MESSAGE, StartState.name);
    })

    it('should have a subscribe method', async () => {
        expect(startState.subscribe).to.be.a('function');
    })

    it('should execute onStart properly and send Finish event', async () => {
        const { shellCDStub }= shellTestBed;
        dockerService.dockerComposeUp.resolves({code: 0} as ShellString);
        await startState.onStart();

        // shell commands: 'cd'
        testSandbox.assert.calledWith(shellCDStub, stateDir);
        testSandbox.assert.calledWith(shellCDStub, '../../');
        testSandbox.assert.calledWith(shellCDStub, 'testDir');
        testSandbox.assert.calledThrice(shellCDStub);

        // loggin messages
        testSandbox.assert.calledThrice(loggerService.info)
        testSandbox.assert.calledWith(loggerService.info, START_STATE_STARTING_MESSAGE, StartState.name);
        testSandbox.assert.calledWith(loggerService.info, START_STATE_STARTED_DETECTING, StartState.name);
        testSandbox.assert.calledWith(loggerService.info, START_STATE_STARTED_MESSAGE, StartState.name);

        testSandbox.assert.calledOnce(processTestBed.processCWDStub);
        testSandbox.assert.calledWith(observerSpy, EventType.Finish);

        testSandbox.assert.calledOnce(loggerService.initializeTerminalUI);
    })

    it('should execute onStart and send DockerError event (when dockerComposeUp status code eq 1)', async () => {
        dockerService.dockerComposeUp.resolves({code: 1} as ShellString);

        await startState.onStart();

        testSandbox.assert.calledTwice(dockerService.dockerComposeUp);
        testSandbox.assert.match(observerSpy.callCount, 2);
        testSandbox.assert.match(observerSpy.args[0], EventType.DockerError);
        testSandbox.assert.match(observerSpy.args[1], EventType.Finish);

        testSandbox.assert.calledOnce(loggerService.initializeTerminalUI);
    })

    it('should execute onStart and handle connectionService error (LocalNodeError)', async () => {
        connectionService.waitForFiringUp.throws(new LocalNodeErrors('test error', 'message'));
        dockerService.dockerComposeUp.resolves({code: 0} as ShellString);

        await startState.onStart();

        testSandbox.assert.calledOnce(dockerService.dockerComposeUp);
        testSandbox.assert.match(observerSpy.callCount, 1);
        testSandbox.assert.match(observerSpy.args[0], EventType.UnknownError);
        testSandbox.assert.calledWith(loggerService.error, 'message', StartState.name);

        testSandbox.assert.calledOnce(loggerService.initializeTerminalUI);
    })

    it('should execute onStart and handle connectionService error (generic error)', async () => {
        connectionService.waitForFiringUp.throws(new Error('test error'));
        dockerService.dockerComposeUp.resolves({code: 0} as ShellString);

        await startState.onStart();

        testSandbox.assert.calledOnce(dockerService.dockerComposeUp);
        testSandbox.assert.match(observerSpy.callCount, 1);
        testSandbox.assert.match(observerSpy.args[0], EventType.UnknownError);
        testSandbox.assert.notCalled(loggerService.error);

        testSandbox.assert.calledOnce(loggerService.initializeTerminalUI);
    })
});
