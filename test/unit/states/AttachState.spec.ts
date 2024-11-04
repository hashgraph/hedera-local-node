import { expect } from 'chai';
import sinon, { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { AttachState } from '../../../src/state/AttachState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIService } from '../../../src/services/CLIService';
import { DockerService } from '../../../src/services/DockerService';
import { LoggerService } from '../../../src/services/LoggerService';
import { EventType } from '../../../src/types/EventType';
import { getTestBed } from '../testBed';

describe('AttachState', () => {
  let attachState: AttachState,
      dockerService: SinonStubbedInstance<DockerService>,
      cliService: SinonStubbedInstance<CLIService>,
      testSandbox: SinonSandbox,
      loggerService: SinonStubbedInstance<LoggerService>;

  before(() => {
    const {
        sandbox,
        dockerServiceStub,
        cliServiceStub,
        loggerServiceStub
    } = getTestBed({
        workDir: 'testDir',
    });

    dockerService = dockerServiceStub
    cliService = cliServiceStub
    testSandbox = sandbox
    loggerService = loggerServiceStub

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
