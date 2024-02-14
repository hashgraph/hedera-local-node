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
import { StateController } from '../../../src/controller/StateController';
import { EventType } from '../../../src/types/EventType';
import { LoggerService } from '../../../src/services/LoggerService';
import { StateData } from '../../../src/data/StateData';
import { InitState } from '../../../src/state/InitState';
import { StartState } from '../../../src/state/StartState';
import { NetworkPrepState } from '../../../src/state/NetworkPrepState';
import { AccountCreationState } from '../../../src/state/AccountCreationState';
import { AttachState } from '../../../src/state/AttachState';
import { CleanUpState } from '../../../src/state/CleanUpState';
import { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { getTestBed } from '../testBed';
import { STATE_CONTROLLER_MISSING_STATE_CONFIG_ERROR } from '../../../src/constants';


describe('StateController', () => {
    let stubbedInitState: SinonStubbedInstance<InitState>,
        stubbedStartState : SinonStubbedInstance<StartState>,
        stubbedNetworkPrepState: SinonStubbedInstance<NetworkPrepState>,
        stubbedAccountCreationState: SinonStubbedInstance<AccountCreationState>,
        cleanUpStateStub: SinonStubbedInstance<CleanUpState>,
        stubbedAttachState: SinonStubbedInstance<AttachState>,
        testSandbox: SinonSandbox, 
        loggerService: SinonStubbedInstance<LoggerService>;

    before(() => {
      const { 
        sandbox,
        loggerServiceStub
      } = getTestBed({
        workDir: 'testDir',
        async: false
      });

      testSandbox = sandbox;
      loggerService = loggerServiceStub;
      stubbedInitState = testSandbox.createStubInstance(InitState);
      stubbedStartState = testSandbox.createStubInstance(StartState);
      stubbedNetworkPrepState = testSandbox.createStubInstance(NetworkPrepState);
      stubbedAccountCreationState = testSandbox.createStubInstance(AccountCreationState);
      cleanUpStateStub = testSandbox.createStubInstance(CleanUpState);
      stubbedAttachState = testSandbox.createStubInstance(AttachState);
    });

    after(() => {
      testSandbox.resetHistory();
    })

  describe('startStateMachine', () => {
    it('should not start without stateConfiguration', async () => {
      const getStartConfigurationStub = testSandbox.stub(StateData.prototype, <any>"getStartConfiguration").returns(false);
      const stateController = new StateController('start');
      const processExitStub = testSandbox.stub(process, 'exit');

      // Starting the state machine
      await stateController.startStateMachine();

      assert.isTrue(processExitStub.calledWith(1));
      testSandbox.assert.calledOnceWithExactly(loggerService.error, STATE_CONTROLLER_MISSING_STATE_CONFIG_ERROR, StateController.name);

      getStartConfigurationStub.restore();
      processExitStub.restore();
    })

    it('should start first state', async () => {
      const getStartConfigurationStub = testSandbox.stub(StateData.prototype, <any>"getStartConfiguration").returns({
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
      assert.isTrue(stubbedInitState.subscribe.calledOnce);

      getStartConfigurationStub.restore();
    })
  })

  describe('update', () => {
    let stateController: StateController;
    let cleanUpStateStub: SinonStubbedInstance<CleanUpState>;
    let getStartConfigurationStub: SinonStub;

    before(() => {
      getStartConfigurationStub = testSandbox.stub(StateData.prototype, <any>"getStartConfiguration").returns({
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
    let getStartConfigurationStub: SinonStub;

    before(() => {
      getStartConfigurationStub = testSandbox.stub(StateData.prototype, <any>"getStartConfiguration").returns({
        'stateMachineName' : 'start',
        'states' : []
      });
      stateController = new StateController('start');
    });

    after(() => {
      getStartConfigurationStub.restore();
    });

    it('should handle other events correctly', async () => {
      const cleanUpState = testSandbox.stub(CleanUpState.prototype, 'onStart');
      const processExitStub = testSandbox.stub(process, 'exit');

      await stateController.update(EventType.UnresolvableError);
  
      assert.isTrue(cleanUpState.calledOnce);
      assert.isTrue(processExitStub.calledWith(1));

      cleanUpState.restore();
      processExitStub.restore();
    });
  });
});
