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

import { expect, assert } from 'chai';
import sinon from 'sinon';
import { StateController } from '../../../src/controller/StateController';
import { EventType } from '../../../src/types/EventType';
import { LoggerService } from '../../../src/services/LoggerService';
import { ServiceLocator } from '../../../src/services/ServiceLocator';
import { StateData } from '../../../src/data/StateData';
import { InitState } from '../../../src/state/InitState';
import { StartState } from '../../../src/state/StartState';
import { NetworkPrepState } from '../../../src/state/NetworkPrepState';
import { AccountCreationState } from '../../../src/state/AccountCreationState';
import { AttachState } from '../../../src/state/AttachState';
import { CleanUpState } from '../../../src/state/CleanUpState';
import { CLIService } from '../../../src/services/CLIService';

describe('StateController', () => {
    let loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
    let stubbedInitState: sinon.SinonStubbedInstance<InitState>;
    let stubbedStartState : sinon.SinonStubbedInstance<StartState>;
    let stubbedNetworkPrepState: sinon.SinonStubbedInstance<NetworkPrepState>;
    let stubbedAccountCreationState: sinon.SinonStubbedInstance<AccountCreationState>;
    let cleanUpStateStub: sinon.SinonStubbedInstance<CleanUpState>;
    let stubbedAttachState: sinon.SinonStubbedInstance<AttachState>;
    let serviceLocatorStub: sinon.SinonStub;
    let cliServiceStub: sinon.SinonStubbedInstance<CLIService>;

    before(() => {
      loggerServiceStub = sinon.createStubInstance(LoggerService);
      stubbedInitState = sinon.createStubInstance(InitState);
      stubbedStartState = sinon.createStubInstance(StartState);
      stubbedNetworkPrepState = sinon.createStubInstance(NetworkPrepState);
      stubbedAccountCreationState = sinon.createStubInstance(AccountCreationState);
      cleanUpStateStub = sinon.createStubInstance(CleanUpState);
      stubbedAttachState = sinon.createStubInstance(AttachState);
      cliServiceStub = sinon.createStubInstance(CLIService);
      serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get');
      serviceLocatorStub.withArgs('LoggerService').returns(loggerServiceStub);
      serviceLocatorStub.withArgs('CLIService').returns(cliServiceStub);
    });

  describe('startStateMachine', () => {

    it('should not start without stateConfiguration', async () => {
      const getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns(false);
      const stateController = new StateController('start');
      const processExitStub = sinon.stub(process, 'exit');

      // Starting the state machine
      await stateController.startStateMachine();

      assert.isTrue(processExitStub.calledWith(1));

      getStartConfigurationStub.restore();
      processExitStub.restore();
    })

    it('should start first state', async () => {
      const getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns({
          'stateMachineName' : 'start',
          'states' : [
            stubbedInitState,
            stubbedStartState,
            stubbedNetworkPrepState,
            stubbedAccountCreationState,
            cleanUpStateStub,
            stubbedAttachState
          ]
      });

      // Starting the state machine
      const stateController = new StateController('start');
      await stateController.startStateMachine();

      expect(stateController['currStateNum']).to.equal(0);
      assert.isTrue(stubbedInitState.onStart.calledOnce);
      getStartConfigurationStub.restore();
    })
  })

  describe('update', () => {
    let stateController: StateController;
    let cleanUpStateStub: sinon.SinonStubbedInstance<CleanUpState>;
    let getStartConfigurationStub: sinon.SinonStub;

    before(() => {
      getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns({
          'stateMachineName' : 'start',
          'states' : [
            stubbedInitState,
            stubbedStartState,
            stubbedNetworkPrepState,
            stubbedAccountCreationState,
            cleanUpStateStub,
            stubbedAttachState
          ]
      });
      stateController = new StateController('start');
    });

    after(() => {
      getStartConfigurationStub.restore();
    });

    it('should transition to next state on Finish event', async () => {
      // Starting the state machine
      await stateController.startStateMachine();

      // Sending two finish events
      await stateController.update(EventType.Finish);
      await stateController.update(EventType.Finish);

      expect(stateController['currStateNum']).to.equal(2);
    });
  });

  describe('update', () => {
    let stateController: StateController;
    let getStartConfigurationStub: sinon.SinonStub;

    before(() => {
      getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns({
        'stateMachineName' : 'start',
        'states' : []
      });
      stateController = new StateController('start');
    });

    after(() => {
      getStartConfigurationStub.restore();
    });

    it('should handle other events correctly', async () => {
      // Arrange
      // Stub process.exit
      const cleanUpState = sinon.stub(CleanUpState.prototype, 'onStart');
      const processExitStub = sinon.stub(process, 'exit');

      // Act
      await stateController.update(EventType.UnresolvableError);
  
      // Assert
      assert.isTrue(cleanUpState.calledOnce);
      assert.isTrue(processExitStub.calledWith(1));
    });
  });
});
