import { expect } from 'chai';
import sinon, { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { AttachState } from '../../../src/state/AttachState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIService } from '../../../src/services/CLIService';
import { EventType } from '../../../src/types/EventType';
import { getTestBed } from '../testBed';

describe('AttachState', () => {
  let attachState: AttachState,
      cliService: SinonStubbedInstance<CLIService>,
      testSandbox: SinonSandbox;

  before(() => {
    const {
        sandbox,
        cliServiceStub
    } = getTestBed({
        workDir: 'testDir',
    });

    cliService = cliServiceStub
    testSandbox = sandbox

    // Create an instance of AttachState
    attachState = new AttachState();
  });

  after(() => {
    testSandbox.resetHistory();
  })

  describe('subscribe', () => {
    it('should set the observer', () => {
      const observer: IOBserver = { update: sinon.stub() };
      attachState.subscribe(observer);

      expect((attachState as any).observer).to.equal(observer);
    });
  });

  describe('onStart', () => {
    it('should call observer update attachContainerLogs when detached', async () => {
      (attachState as any).observer = { update: testSandbox.stub()};
      cliService.getCurrentArgv.returns({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
      } as any);
      await attachState.onStart();

      testSandbox.assert.calledOnceWithExactly(attachState.observer?.update, EventType.Finish);
    });
  });
});
