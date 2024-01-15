import { assert } from 'chai';
import sinon from 'sinon';
import { StateController } from '../src/controller/StateController';
import { EventType } from '../src/types/EventType';
import { LoggerService } from '../src/services/LoggerService';
import { ServiceLocator } from '../src/services/ServiceLocator';
import { StateData } from '../src/data/StateData';
import { CleanUpState } from '../src/state/CleanUpState';
import { CLIService } from '../src/services/CLIService';

describe('StateController2', () => {
  let stateController: StateController;
  let cleanUpStateStub: sinon.SinonStubbedInstance<CleanUpState>;
  let getStartConfigurationStub: sinon.SinonStub;
  before(() => {
    const loggerServce = new LoggerService(1);
    ServiceLocator.Current.register(loggerServce);
    const cliService = new CLIService({ "$0": '' , _: ['start'] })
    ServiceLocator.Current.register(cliService);
  });
  beforeEach(() => {
    // cleanUpStateStub = sinon.createStubInstance(CleanUpState);
    // cleanUpStateStub.onStart.resolves();
    //cleanUpStateStub = sinon.stub(CleanUpState.prototype, <any>"onStart").resolves();

    getStartConfigurationStub = sinon.stub(StateData.prototype, <any>"getStartConfiguration").returns({
        'stateMachineName' : 'start',
        'states' : []
    });
    stateController = new StateController('start');
  });

  afterEach(() => {
    // Restore the original ServiceLocator after each test
    // cleanUpStateStub.onStart.restore();
    // serviceLocatorStub.restore();
    // getStartConfigurationStub.restore();
  });


  it('should handle other events correctly', async () => {
    // Arrange
    // Stub process.exit
    const processExitStub = sinon.stub(process, 'exit');
    const cleanUpState = sinon.stub(CleanUpState.prototype, 'onStart');
    // Act

    await stateController.update(EventType.UnresolvableError);

    // Assert
    assert.isTrue(cleanUpState.calledOnce);
    assert.isTrue(processExitStub.calledWith(1));
  });
});
