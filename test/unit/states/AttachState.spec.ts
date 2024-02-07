import { expect } from 'chai';
import sinon, { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { AttachState } from '../../../src/state/AttachState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIService } from '../../../src/services/CLIService';
import { DockerService } from '../../../src/services/DockerService';
import { EventType } from '../../../src/types/EventType';
import { getTestBed } from '../testBed';

describe('AttachState', () => {
  let attachState: AttachState,
      dockerService: SinonStubbedInstance<DockerService>,
      cliService: SinonStubbedInstance<CLIService>,
      testSandbox: SinonSandbox,
      continuouslyUpdateStatusBoardStub: SinonStub;;

  before(() => {
    const {
        sandbox,
        dockerServiceStub,
        cliServiceStub
    } = getTestBed({
        workDir: 'testDir',
    });

    dockerService = dockerServiceStub
    cliService = cliServiceStub
    testSandbox = sandbox

    continuouslyUpdateStatusBoardStub = testSandbox.stub(AttachState.prototype, <any>'continuouslyUpdateStatusBoard');

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
      await attachState.onStart();

      expect(attachContainerLogsStub.calledThrice).to.be.true;
      expect(attachContainerLogsStub.firstCall.calledWithExactly("network-node")).to.be.true;
      expect(attachContainerLogsStub.secondCall.calledWithExactly("mirror-node-rest")).to.be.true;
      expect(attachContainerLogsStub.thirdCall.calledWithExactly("json-rpc-relay")).to.be.true;
      testSandbox.assert.called(continuouslyUpdateStatusBoardStub);

      attachContainerLogsStub.restore();
    });

    it('should call observer update attachContainerLogs when detached', async () => {
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

      await attachState.onStart();

      testSandbox.assert.called(continuouslyUpdateStatusBoardStub);
      testSandbox.assert.calledOnceWithExactly(attachState.observer?.update, EventType.Finish);

      attachContainerLogsStub.restore();
    });
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
      attachContainerLogsStub.withArgs("mirror-node-rest").resolves();
      attachContainerLogsStub.withArgs("json-rpc-relay").resolves();
      attachContainerLogsStub.callThrough();

      await attachState.onStart();

      testSandbox.assert.calledOnce(dockerService.getContainer);
      const spy1 = dockerService.getContainer.getCall(0);
      testSandbox.assert.called(continuouslyUpdateStatusBoardStub);
      testSandbox.assert.calledWithExactly(spy1, "network-node");
      testSandbox.assert.calledOnce(logsSpy);
    });
  });
});
