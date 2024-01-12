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
  let cleanUpStateStub2 : sinon.SinonStubbedInstance<CleanUpState>;
  let getStartConfigurationStub: sinon.SinonStub;
  //let serviceLocatorStub;
  // const stubbedServiceLocator = sinon.createStubInstance(ServiceLocator);
  // const loggerServiceStub = sinon.createStubInstance(LoggerService);
  //
  // stubbedServiceLocator.get.callsFake(function() {
  //   return loggerServiceStub;
  // });
  //
  // sinon.stub(ServiceLocator, 'Current').callsFake(function () {
  //   return stubbedServiceLocator;
  // });
  //
  // stateController = new StateController('start');
  // process.exit(1);

  beforeEach(() => {
    // Create a stub for the ServiceLocator
    const stubbedInitState = sinon.createStubInstance(InitState);
    const stubbedStartState = sinon.createStubInstance(StartState);
    const stubbedNetworkPrepState = sinon.createStubInstance(NetworkPrepState);
    const stubbedAccountCreationState = sinon.createStubInstance(AccountCreationState);
    cleanUpStateStub = sinon.createStubInstance(CleanUpState);
    cleanUpStateStub2 = sinon.createStubInstance(CleanUpState);
    cleanUpStateStub2.onStart.resolves();
    const stubbedAttachState = sinon.createStubInstance(AttachState);
    const loggerServiceStub = sinon.createStubInstance(LoggerService);
    const stubbedConfiguration: StateConfiguration = {
      'stateMachineName': 'stubbed',
      'states': [
          { subscribe: sinon.stub(), onStart: sinon.stub() },
          // Add more stubbed states as needed
      ]
    };

    serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get').returns(loggerServiceStub);

    //stateDataStub = sinon.stub(StateData.prototype, <any>'getSelectedStateConfiguration').returns(undefined);

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
    // await stateController.update(EventType.UnknownError);
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
