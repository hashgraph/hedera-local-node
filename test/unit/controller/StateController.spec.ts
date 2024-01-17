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

  describe('should transition to next state on Finish event', () => {
    let stateController: StateController;
    let serviceLocatorStub: sinon.SinonStub;
    let cleanUpStateStub: sinon.SinonStubbedInstance<CleanUpState>;
    let getStartConfigurationStub: sinon.SinonStub;

    before(() => {
      // Create a stub for the ServiceLocator
      const stubbedInitState = sinon.createStubInstance(InitState);
      const stubbedStartState = sinon.createStubInstance(StartState);
      const stubbedNetworkPrepState = sinon.createStubInstance(NetworkPrepState);
      const stubbedAccountCreationState = sinon.createStubInstance(AccountCreationState);
      cleanUpStateStub = sinon.createStubInstance(CleanUpState);
      const stubbedAttachState = sinon.createStubInstance(AttachState);
      const loggerServiceStub = sinon.createStubInstance(LoggerService);
  
      serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get').returns(loggerServiceStub);
  
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
      // Restore the original ServiceLocator after each test
      cleanUpStateStub.onStart.restore();
      serviceLocatorStub.restore();
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

  describe('should handle other events correctly', () => {
    let stateController: StateController;
    let getStartConfigurationStub: sinon.SinonStub;

    before(() => {
      const loggerServiceStub = sinon.createStubInstance(LoggerService);
      const cliServiceStub = sinon.createStubInstance(CLIService);
      
      // Stub the first call to ServiceLocator.Current.get
      const getStub1 = sinon.stub(ServiceLocator.Current, 'get');
      getStub1.onFirstCall().returns(loggerServiceStub);
      getStub1.onSecondCall().returns(cliServiceStub);
      getStub1.onThirdCall().returns(loggerServiceStub);

      getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns({
        'stateMachineName' : 'start',
        'states' : []
      });
      stateController = new StateController('start');
    });

    after(() => {
      // Restore the original ServiceLocator after each test
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
