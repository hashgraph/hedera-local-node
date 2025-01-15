// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';
import sinon from 'sinon';
import { StopState } from '../../../src/state/StopState';
import {
    DOCKER_CLEANING_VOLUMES_MESSAGE,
    DOCKER_STOPPING_CONTAINERS_MESSAGE,
    IS_WINDOWS,
    NETWORK_PREFIX,
    STOP_STATE_INIT_MESSAGE,
    STOP_STATE_ON_START_MESSAGE,
    STOP_STATE_STOPPED_MESSAGE,
    STOP_STATE_STOPPING_MESSAGE,
} from "../../../src/constants";
import path from 'path';
import { getTestBed } from '../testBed';
import { LoggerService } from '../../../src/services/LoggerService';

describe('StopState tests', () => {
    let stopState: StopState,
        testSandbox: sinon.SinonSandbox, 
        loggerService: sinon.SinonStubbedInstance<LoggerService>,
        serviceLocator: sinon.SinonStub,
        processTest: {[key: string]: sinon.SinonStub},
        shellTest: {[key: string]: sinon.SinonStub};

    const TEST_DIR_MESSAGE = `Working dir is testDir`;
    const stateDir = path.resolve(__dirname, '../../../src/state');

    before(() => {
      let {
        sandbox,
        loggerServiceStub,
        serviceLocatorStub,
        proccesStubs,
        shellStubs
      } = getTestBed({
        workDir: 'testDir',
      });

      testSandbox = sandbox
      loggerService = loggerServiceStub
      serviceLocator = serviceLocatorStub
      processTest = proccesStubs
      shellTest = shellStubs

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
        const { shellCDStub, shellExecStub }= shellTest;
        const network = { name: 'hedera-cloud-storage', id: '89ded1eca1d5' };
        shellExecStub
          .withArgs(`docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`)
          .returns({ stderr: '', stdout: network.id });

        await stopState.onStart();

        // loggin messages
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_ON_START_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_STOPPING_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, DOCKER_STOPPING_CONTAINERS_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, DOCKER_CLEANING_VOLUMES_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.trace, TEST_DIR_MESSAGE, StopState.name);
        testSandbox.assert.calledWith(loggerService.info, STOP_STATE_STOPPED_MESSAGE, StopState.name);
        
        // shell commands: 'cd'
        testSandbox.assert.calledWith(shellCDStub, stateDir);
        testSandbox.assert.calledWith(shellCDStub, '../../');
        testSandbox.assert.calledWith(shellCDStub, 'testDir');
        testSandbox.assert.calledThrice(shellCDStub);

        // shell commands: 'exec'
        testSandbox.assert.calledWith(shellExecStub, `docker compose kill --remove-orphans 2>${IS_WINDOWS ? 'null' : '/dev/null'}`);
        testSandbox.assert.calledWith(shellExecStub, `docker compose down -v --remove-orphans 2>${IS_WINDOWS ? 'null' : '/dev/null'}`);
        testSandbox.assert.calledWith(shellExecStub, `rm -rf network-logs/* >${IS_WINDOWS ? 'null' : '/dev/null'} 2>&1`);
        testSandbox.assert.calledWith(shellExecStub, `rm -rf "testDir/network-logs" >${IS_WINDOWS ? 'null' : '/dev/null'} 2>&1`);
        testSandbox.assert.calledWith(shellExecStub, `docker network ls --filter name=${NETWORK_PREFIX} --format "{{.ID}}"`);

        expect(processTest.processCWDStub.calledOnce).to.be.true;
    })

});
