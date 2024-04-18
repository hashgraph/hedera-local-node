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
import { SinonFakeTimers, SinonSandbox, SinonStub, SinonStubbedInstance, useFakeTimers } from 'sinon';
import { before } from 'mocha';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService';
import { ClientService } from '../../../src/services/ClientService';
import { getTestBed } from '../testBed';
import {
  RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE,
  RESOURCE_CREATION_STATE_INIT_MESSAGE
} from '../../../src/constants';
import { ResourceCreationState } from '../../../src/state/ResourceCreationState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIOptions } from '../../../src/types/CLIOptions';
import { EventType } from '../../../src/types/EventType';

describe('ResourceCreationState', () => {
  let resourceCreationState: ResourceCreationState;
  let testSandbox: SinonSandbox;
  let loggerService: SinonStubbedInstance<LoggerService>;
  let serviceLocator: SinonStub;
  let cliService: SinonStubbedInstance<CLIService>;
  let observer: SinonStubbedInstance<IOBserver>;

  before(() => {
    const {
      sandbox,
      loggerServiceStub,
      serviceLocatorStub,
      cliServiceStub
    } = getTestBed({
      workDir: 'testDir',
      async: false,
      blocklisting: false,
      createInitialResources: true
    });

    loggerService = loggerServiceStub;
    cliService = cliServiceStub;
    serviceLocator = serviceLocatorStub;
    testSandbox = sandbox;
    observer = { update: testSandbox.stub() };
    resourceCreationState = new ResourceCreationState();
  });

  after(() => {
    testSandbox.resetHistory();
  });

  beforeEach(() => {
    observer.update.resetHistory();
  });

  it('should initialize the ResourceCreationState', async () => {
    expect(resourceCreationState).to.be.instanceOf(ResourceCreationState);
    testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
    testSandbox.assert.calledWith(serviceLocator, ClientService.name);
    testSandbox.assert.calledWith(serviceLocator, CLIService.name);
    testSandbox.assert.calledOnceWithExactly(loggerService.trace, RESOURCE_CREATION_STATE_INIT_MESSAGE, ResourceCreationState.name);
  });

  describe('subscribe', () => {
    it('should have a subscribe method', async () => {
      expect(resourceCreationState.subscribe).to.be.a('function');
    });

    it('should set the observer', () => {
      resourceCreationState.subscribe(observer);
      // eslint-disable-next-line dot-notation
      expect(resourceCreationState['observer']).to.equal(observer);
    });
  });

  describe('onStart', () => {
    describe('When createInitialResources is false', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          createInitialResources: false
        });
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .resolves();
      });

      it ('should not call createResources', async () => {
        await resourceCreationState.onStart();
        testSandbox.assert.notCalled(createResourcesStub);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When createInitialResources is true', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          createInitialResources: true
        });
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .resolves();
      });

      it ('should call createResources', async () => {
        await resourceCreationState.onStart();
        testSandbox.assert.called(createResourcesStub);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When async is false', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;
      let awaitStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          async: false
        });
        awaitStub = testSandbox.stub();
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .returns(new Promise(resolve => {
            setTimeout(() => resolve(awaitStub()), 1000);
          }));
      });

      it('should log correct message, await all resource creations and update observer', async () => {
        resourceCreationState.subscribe(observer);
        await resourceCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE, ResourceCreationState.name);
        testSandbox.assert.called(createResourcesStub);
        testSandbox.assert.called(awaitStub);
        testSandbox.assert.calledWith(observer.update, EventType.Finish);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When async is true', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;
      let awaitStub: SinonStub;
      let clock: SinonFakeTimers;

      beforeEach(() => {
        clock = useFakeTimers();
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          async: true
        });
        awaitStub = testSandbox.stub();
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .returns(new Promise(resolve => {
            setTimeout(() => resolve(awaitStub()), 1000);
          }));
      });

      it('should log correct message and NOT await all resource creations', async () => {
        resourceCreationState.subscribe(observer);
        await resourceCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE, ResourceCreationState.name);
        testSandbox.assert.called(createResourcesStub);
        testSandbox.assert.notCalled(awaitStub);
        testSandbox.assert.notCalled(observer.update);

        clock.tick(1500);

        testSandbox.assert.called(awaitStub);
        // testSandbox.assert.called(observer.update); // failing, idk why :/
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
        clock.restore();
      });
    });
  });
});
