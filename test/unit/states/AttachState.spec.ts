import { expect } from 'chai';
import sinon, { SinonStubbedInstance } from 'sinon';
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
      cliService: SinonStubbedInstance<CLIService>;

  beforeEach(() => {
    const {
        loggerServiceStub,
        dockerServiceStub,
        cliServiceStub
    } = getTestBed({
        workDir: 'testDir',
    });

    dockerService = dockerServiceStub
    loggerService = loggerServiceStub
    cliService = cliServiceStub

    // Create an instance of AttachState
    attachState = new AttachState();
  });

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
      const attachContainerLogsStub = sinon.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = sinon.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);

      await attachState.onStart();

      expect(attachContainerLogsStub.calledThrice).to.be.true;
      expect(attachContainerLogsStub.firstCall.calledWithExactly("network-node")).to.be.true;
      expect(attachContainerLogsStub.secondCall.calledWithExactly("mirror-node-rest")).to.be.true;
      expect(attachContainerLogsStub.thirdCall.calledWithExactly("json-rpc-relay")).to.be.true;
      sinon.assert.calledTwice(loggerService.updateStatusBoard);

      attachContainerLogsStub.restore();
      iterations.restore();
    }).timeout(20000);

    it('should not call attachContainerLogs when detached', async () => {
      (attachState as any).observer = { update: sinon.stub()};
      cliService.getCurrentArgv.returns({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
        detached: true
      } as any);
      const attachContainerLogsStub = sinon.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = sinon.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);

      await attachState.onStart();

      sinon.assert.calledOnceWithExactly(attachState.observer?.update, EventType.Finish);
      attachContainerLogsStub.restore();
      iterations.restore();
    }).timeout(20000);
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
      const logsSpy = sinon.spy();
      const demuxSpy = sinon.spy();
      dockerService.getContainer.resolves({
        logs: logsSpy,
        modem: { demuxStream: demuxSpy },
      } as any);
      const attachContainerLogsStub = sinon.stub(AttachState.prototype, <any>'attachContainerLogs');
      const iterations = sinon.stub(AttachState.prototype, <any>'loopIterations');
      iterations.returns(2);
      attachContainerLogsStub.withArgs("mirror-node-rest").resolves();
      attachContainerLogsStub.withArgs("json-rpc-relay").resolves();
      attachContainerLogsStub.callThrough();

      await attachState.onStart();

      sinon.assert.calledOnce(dockerService.getContainer);
      const spy1 = dockerService.getContainer.getCall(0);

      sinon.assert.calledWithExactly(spy1, "network-node");
      sinon.assert.calledOnce(logsSpy);
    }).timeout(20000);
  });
});
