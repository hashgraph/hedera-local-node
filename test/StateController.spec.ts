import { expect } from 'chai';
import { StateController } from '../src/controller/StateController';
import { EventType } from '../src/types/EventType';

describe('StateController', () => {
  it('should transition to next state on Finish event', async () => {
    const stateController = new StateController('start');
    await stateController.startStateMachine();

    await stateController.update(EventType.Finish);

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
