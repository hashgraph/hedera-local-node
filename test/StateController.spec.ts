import { expect } from 'chai';
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
import { StateConfiguration } from '../src/types/StateConfiguration';


describe('StateController', () => {
  let stateController: StateController;
  let serviceLocatorStub: sinon.SinonStub;
  let stateDataStub: sinon.SinonStubbedInstance<StateData>;

  beforeEach(() => {
    // Create a stub for the ServiceLocator
    const stubbedInitState = sinon.createStubInstance(InitState);
    const stubbedStartState = sinon.createStubInstance(StartState);
    const stubbedNetworkPrepState = sinon.createStubInstance(NetworkPrepState);
    const stubbedAccountCreationState = sinon.createStubInstance(AccountCreationState);
    const stubbedCleanUpState = sinon.createStubInstance(CleanUpState);
    const stubbedAttachState = sinon.createStubInstance(AttachState);
    const loggerServiceStub = sinon.createStubInstance(LoggerService);
    const stubbedConfiguration: StateConfiguration = {
      'stateMachineName': 'stubbed',
      'states': [
          { subscribe: sinon.stub(), onStart: sinon.stub() },
          // Add more stubbed states as needed
      ]
    };
    // const stateDataStub = sinon.createStubInstance(StateData,{
    //   getSelectedStateConfiguration: stubbedConfiguration
    // });
    //serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get').returns(new LoggerService(0));
    // Stub ServiceLocator
    sinon.stub(ServiceLocator.Current, 'get').returns(loggerServiceStub);
    // Initialize the StateController
    //stateController = new StateController('start');
    // stateDataStub.getSelectedStateConfiguration.restore();
    // sinon.stub(stateDataStub, 'getSelectedStateConfiguration').returns(stubbedConfiguration);
    // Stub the creation of StateData instance
    //sinon.stub(StateData.prototype, 'getSelectedStateConfiguration').returns(stateDataStub);
    // Initialize the StateController
    stateDataStub = sinon.createStubInstance(StateData, {
      getSelectedStateConfiguration: stubbedConfiguration
    });
    stateController = new StateController('start');
  });

  afterEach(() => {
    // Restore the original ServiceLocator after each test
    serviceLocatorStub.restore();
  });

  it.only('should transition to next state on Finish event', async () => {
    //const stateController = new StateController('start');
    await stateController.startStateMachine();
    await stateController.update(EventType.Finish);
    console.log(stateController['currStateNum']);
    expect(stateController['currStateNum']).to.equal(1);
  });

  it('should handle UnknownError or UnresolvableError event correctly', async () => {
    const stateController = new StateController('exampleState');

    await stateController.update(EventType.UnknownError);
  });

  it('should handle other events correctly', async () => {
    const stateController = new StateController('exampleState');

    // Mocking a custom event
    const customEvent = 'CustomEvent';
    await stateController.update(EventType.Finish);
  });
});
