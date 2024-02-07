import { expect } from 'chai';
import sinon, { SinonSandbox, SinonStubbedInstance } from 'sinon';
import { AttachState } from '../../../src/state/AttachState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIService } from '../../../src/services/CLIService';
import { DockerService } from '../../../src/services/DockerService';
import { LoggerService } from '../../../src/services/LoggerService';
import { EventType } from '../../../src/types/EventType';
import { getTestBed } from '../testBed';

describe('AttachState', () => {
  let attachState: AttachState,
      loggerService: SinonStubbedInstance<LoggerService>,
      dockerService: SinonStubbedInstance<DockerService>,
      cliService: SinonStubbedInstance<CLIService>,
      testSandbox: SinonSandbox;

  before(() => {
    const {
        sandbox,
        loggerServiceStub,
        dockerServiceStub,
        cliServiceStub
    } = getTestBed({
        workDir: 'testDir',
    });

    dockerService = dockerServiceStub
    loggerService = loggerServiceStub
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
    it('should call attachContainerLogs for consensus, mirror, and relay', async () => {
      cliService.getCurrentArgv.returns({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
        detached: false
      } as any);
      const attachContainerLogsStub = testSandbox.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = testSandbox.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);

      await attachState.onStart();

      expect(attachContainerLogsStub.calledThrice).to.be.true;
      expect(attachContainerLogsStub.firstCall.calledWithExactly("network-node")).to.be.true;
      expect(attachContainerLogsStub.secondCall.calledWithExactly("mirror-node-rest")).to.be.true;
      expect(attachContainerLogsStub.thirdCall.calledWithExactly("json-rpc-relay")).to.be.true;
      testSandbox.assert.calledTwice(loggerService.updateStatusBoard);

      attachContainerLogsStub.restore();
      iterations.restore();
    }).timeout(25000);

    it('should not call attachContainerLogs when detached', async () => {
      (attachState as any).observer = { update: testSandbox.stub()};
      cliService.getCurrentArgv.returns({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
        detached: true
      } as any);
      const attachContainerLogsStub = testSandbox.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = testSandbox.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);

      await attachState.onStart();

      testSandbox.assert.calledOnceWithExactly(attachState.observer?.update, EventType.Finish);
      attachContainerLogsStub.restore();
      iterations.restore();
    }).timeout(25000);
  });

  describe('attachContainerLogs', () => {
    it('should attach container logs and filter out lines with "Transaction ID: 0.0.2-"', async () => {
      cliService.getCurrentArgv.returns({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
        detached: false
      } as any);
      const logsSpy = testSandbox.spy();
      const demuxSpy = testSandbox.spy();
      dockerService.getContainer.resolves({
        logs: logsSpy,
        modem: { demuxStream: demuxSpy },
      } as any);
      const attachContainerLogsStub = testSandbox.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = testSandbox.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);
      attachContainerLogsStub.withArgs("mirror-node-rest").resolves();
      attachContainerLogsStub.withArgs("json-rpc-relay").resolves();
      attachContainerLogsStub.callThrough();

      await attachState.onStart();

      testSandbox.assert.calledOnce(dockerService.getContainer);
      const spy1 = dockerService.getContainer.getCall(0);

      testSandbox.assert.calledWithExactly(spy1, "network-node");
      testSandbox.assert.calledOnce(logsSpy);
    }).timeout(25000);
  });
});
