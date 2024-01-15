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
import { StateConfiguration } from '../src/types/StateConfiguration';


describe('StateController', () => {
  let stateController: StateController;
  let serviceLocatorStub: sinon.SinonStub;
  let stateDataStub: sinon.SinonStub;
  let cleanUpStateStub: sinon.SinonStubbedInstance<CleanUpState>;
  let cleanUpStateStub2 : sinon.SinonStub;
  let getStartConfigurationStub: sinon.SinonStub;

  beforeEach(() => {
    // Create a stub for the ServiceLocator
    const stubbedInitState = sinon.createStubInstance(InitState);
    const stubbedStartState = sinon.createStubInstance(StartState);
    const stubbedNetworkPrepState = sinon.createStubInstance(NetworkPrepState);
    const stubbedAccountCreationState = sinon.createStubInstance(AccountCreationState);
    cleanUpStateStub = sinon.createStubInstance(CleanUpState);
    // cleanUpStateStub2 = sinon.createStubInstance(CleanUpState);
    // cleanUpStateStub2.onStart.resolves();
    cleanUpStateStub2 = sinon.stub(CleanUpState.prototype, 'onStart').resolves();

    // Stubbing the CleanUpState constructor
    //sinon.stub(CleanUpState.prototype, 'constructor').returns(cleanUpStateStub2);
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

  afterEach(() => {
    // Restore the original ServiceLocator after each test
    cleanUpStateStub.onStart.restore();
    cleanUpStateStub2.restore();
    serviceLocatorStub.restore();
    getStartConfigurationStub.restore();
    //stateDataStub.getSelectedStateConfiguration.restore();
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


  it('should handle other events correctly', async () => {
    // Arrange
    // Stub process.exit
    const processExitStub = sinon.stub(process, 'exit');
    // Act
    await stateController.update(EventType.UnresolvableError);

    // Assert
    assert.isTrue(cleanUpStateStub2.onStart.calledOnce);
    assert.isTrue(processExitStub.calledWith(1));
    //assert.isTrue(0);
    // assert.isTrue(unresolvableErrorStub.calledOnce);
    // assert.isTrue(processExitStub.calledWith(1));

    // Restore the stubs for the next test
    // unknownErrorStub.restore();
    // unresolvableErrorStub.restore();
  });
});
