import { expect, assert } from 'chai';
import sinon from 'sinon';
import { StateController } from '../src/controller/StateController';
import { EventType } from '../src/types/EventType';
import { LoggerService } from '../src/services/LoggerService';
import { ServiceLocator } from '../src/services/ServiceLocator';
import { StateData } from '../src/data/StateData';
import { InitState } from '../src/state/InitState';
import { StartState } from '../src/state/StartState';
import { NetworkPrepState } from '../src/state/NetworkPrepState';
import { AccountCreationState } from '../src/state/AccountCreationState';
import { AttachState } from '../src/state/AttachState';
import { CleanUpState } from '../src/state/CleanUpState';
import { CLIService } from '../src/services/CLIService';

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
      const loggerServce = new LoggerService(1);
      ServiceLocator.Current.register(loggerServce);
      const cliService = new CLIService({ "$0": '' , _: ['start'] });
      ServiceLocator.Current.register(cliService);

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
