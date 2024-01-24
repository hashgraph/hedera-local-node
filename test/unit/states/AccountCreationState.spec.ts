import { expect } from 'chai';
import sinon from 'sinon';
import { AccountCreationState } from '../../../src/state/AccountCreationState';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService'
import { ClientService } from '../../../src/services/ClientService';
import { EventType } from '../../../src/types/EventType';
import { ServiceLocator } from '../../../src/services/ServiceLocator';
import { StateController } from '../../../src/controller/StateController';
import {
  AccountCreateTransaction, AccountId, AccountInfoQuery,
  Hbar, PrivateKey, PublicKey, TransferTransaction, Wallet
} from '@hashgraph/sdk';


describe('AccountCreationState', () => {
  let accountCreationState: AccountCreationState;
  let loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
  let cliServiceStub: sinon.SinonStubbedInstance<CLIService>;
  let clientServiceStub: sinon.SinonStubbedInstance<ClientService>;
  let serviceLocatorStub: sinon.SinonStub;

  beforeEach(() => {
    loggerServiceStub = sinon.createStubInstance(LoggerService);
    cliServiceStub = sinon.createStubInstance(CLIService, {
      getCurrentArgv: {
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
      } as any
    });
    clientServiceStub = sinon.createStubInstance(ClientService);

    serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get');
    serviceLocatorStub.withArgs('LoggerService').returns(loggerServiceStub);
    serviceLocatorStub.withArgs('CLIService').returns(cliServiceStub);
    serviceLocatorStub.withArgs('ClientService').returns(clientServiceStub);
    accountCreationState = new AccountCreationState();
  });

  afterEach(() => {
    serviceLocatorStub.restore();
    cliServiceStub.getCurrentArgv.restore();
  })

  describe('onStart', () => {
    it('should log information when starting in synchronous mode', async () => {
      const generateECDSAStub = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      const generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
      const generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
      const stateControllerStub = sinon.createStubInstance(StateController);
      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateECDSAStub);
      sinon.assert.called(generateAliasECDSA);
      sinon.assert.called(generateED25519);
      sinon.assert.called(stateControllerStub.update);

      generateECDSAStub.restore();
      generateAliasECDSA.restore();
      generateED25519.restore();
    });

    it('should log information when starting in asynchronous mode', async () => {
      cliServiceStub.getCurrentArgv.returns({
        async: true,
        blocklisting: false,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);
      const generateAsyncStub = sinon.stub(AccountCreationState.prototype, <any>'generateAsync').resolves();
      const stateControllerStub = sinon.createStubInstance(StateController);
      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateAsyncStub);
      generateAsyncStub.restore();
    });

    it('should log information when blocklisting is enabled', async () => {
      cliServiceStub.getCurrentArgv.returns({
        async: true,
        blocklisting: true,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);

      const getBlocklistedAccountsCountStub = sinon.stub(AccountCreationState.prototype, <any>'getBlocklistedAccountsCount').returns(1);
      const generateAsyncStub = sinon.stub(AccountCreationState.prototype, <any>'generateAsync').resolves();
      const stateControllerStub = sinon.createStubInstance(StateController);
      await accountCreationState.subscribe(stateControllerStub);

      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode with 1 blocklisted accounts', 'AccountCreationState');
      sinon.assert.called(generateAsyncStub);
      sinon.assert.called(getBlocklistedAccountsCountStub);
      getBlocklistedAccountsCountStub.restore();
    });
  });

  describe('subscribe', () => {
    it('should set the observer', () => {
      const observer = { update: sinon.stub() };
      accountCreationState.subscribe(observer);
      expect(accountCreationState['observer']).to.equal(observer);
    });
  });

  // describe('getBlocklistedAccountsCount', () => {
  //   it('should return the count of blocklisted accounts', async () => {
  //     // Mock the behavior of fs.createReadStream and csv-parser
  //     const createReadStreamStub = sinon.stub();
  //     const pipeStub = sinon.stub();
  //     const onStub = sinon.stub();
  //     createReadStreamStub.returns({ pipe: pipeStub });
  //     pipeStub.returns({ on: onStub });
  //     onStub.withArgs('data').yields('some data');
  //     onStub.withArgs('end').yields();

  //     // Stub path.join to return a valid file path
  //     sinon.stub(accountCreationState, 'blockListFileName').returns('blocklist.csv');
  //     sinon.stub(accountCreationState, 'getBlocklistedAccountsCount').returns(42);

  //     const count = await accountCreationState.getBlocklistedAccountsCount();

  //     expect(count).to.equal(42);
  //   });
  // });

  describe('generateECDSA', () => {
    let generateAliasECDSA: sinon.SinonStub;
    let generateED25519: sinon.SinonStub;
    let createAccountStub: sinon.SinonStub;
    let logAccountStub: sinon.SinonStub;
    let privateKeyStub: sinon.SinonStub;
    let stateControllerStub: sinon.SinonStubbedInstance<StateController>;

    beforeEach(() => {
      generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
      generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
      createAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAccount').resolves();
      logAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      privateKeyStub = sinon.stub(PrivateKey, 'generateECDSA').returns({'privateKey': 'some'} as any);
      stateControllerStub = sinon.createStubInstance(StateController);
    })

    afterEach(() => {
      generateAliasECDSA.restore();
      generateED25519.restore();
      createAccountStub.restore();
      logAccountStub.restore();
      privateKeyStub.restore();
    })

    it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
      //const generateECDSAStub = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      // accountCreationState['nodeStartup'] = true;
      const walletStubInstance = sinon.createStubInstance(Wallet);
      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateAliasECDSA);
      sinon.assert.called(generateED25519);
      sinon.assert.callCount(privateKeyStub, 10);
      sinon.assert.callCount(createAccountStub, 10);
      sinon.assert.calledOnce(logAccountStub);
      sinon.assert.called(stateControllerStub.update);
    });
  });

  describe('generateAliasECDSA', () => {
    let generateECDSA: sinon.SinonStub;
    let generateED25519: sinon.SinonStub;
    let createAliasAccountStub: sinon.SinonStub;
    let logAliasAccountTitleStub: sinon.SinonStub;
    let logAliasAccountStub: sinon.SinonStub;
    let privateKeyStub: sinon.SinonStub;
    let stateControllerStub: sinon.SinonStubbedInstance<StateController>;

    beforeEach(() => {
      generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
      createAliasAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAliasAccount').returns({
        'accountId': 'someid',
        'wallet': {'signingKey': {'privateKey': ''}},
        'balance': 'balance'
      });
      logAliasAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccountTitle').resolves();
      //privateKeyStub = sinon.stub(PrivateKey, 'generateECDSA').returns({'privateKey': 'some'} as any);
      stateControllerStub = sinon.createStubInstance(StateController);
      logAliasAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccount').resolves();
    })

    afterEach(() => {
      generateECDSA.restore();
      generateED25519.restore();
      createAliasAccountStub.restore();
      logAliasAccountTitleStub.restore();
      logAliasAccountStub.restore();
    })

    it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
      //const generateECDSAStub = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();

      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateECDSA);
      sinon.assert.called(generateED25519);
      sinon.assert.callCount(logAliasAccountStub, 10);
      sinon.assert.callCount(createAliasAccountStub, 10);
      sinon.assert.calledOnce(logAliasAccountTitleStub);
      sinon.assert.called(stateControllerStub.update);
    });
  });

  describe('generateED25519', () => {
    let generateAliasECDSA: sinon.SinonStub;
    let generateECDSA: sinon.SinonStub;
    let createAccountStub: sinon.SinonStub;
    let logAccountTitleStub: sinon.SinonStub;
    let privateKeyStub: sinon.SinonStub;
    let stateControllerStub: sinon.SinonStubbedInstance<StateController>;

    beforeEach(() => {
      generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
      generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      createAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAccount').resolves();
      logAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      privateKeyStub = sinon.stub(PrivateKey, 'generateED25519').returns({'privateKey': 'some'} as any);
      stateControllerStub = sinon.createStubInstance(StateController);
    })

    afterEach(() => {
      generateAliasECDSA.restore();
      generateECDSA.restore();
      createAccountStub.restore();
      logAccountTitleStub.restore();
      privateKeyStub.restore();
    })

    it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
      //const generateECDSAStub = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      // accountCreationState['nodeStartup'] = true;
      const walletStubInstance = sinon.createStubInstance(Wallet);
      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateAliasECDSA);
      sinon.assert.called(generateECDSA);
      sinon.assert.callCount(privateKeyStub, 10);
      sinon.assert.callCount(createAccountStub, 10);
      sinon.assert.calledOnceWithExactly(logAccountTitleStub, 'ED25519');
      sinon.assert.called(stateControllerStub.update);
    });
  });

  describe('generateAsync', () => {
    let generateAliasECDSA: sinon.SinonStub;
    let generateECDSA: sinon.SinonStub;
    let generateED25519: sinon.SinonStub;
    let createAccountStub: sinon.SinonStub;
    let logAccountTitleStub: sinon.SinonStub;
    let privateKeyStub: sinon.SinonStub;
    let stateControllerStub: sinon.SinonStubbedInstance<StateController>;
    let logAccountStub: sinon.SinonStub;
    let logAccountDividerStub: sinon.SinonStub;
    let logAliasAccountStub: sinon.SinonStub;
    let logAliasAccountTitleStub: sinon.SinonStub;

    beforeEach(() => {
      const accounts = []
      generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').returns([
        { 'accountId': 'someid1', 'wallet': '', 'balance': 'balance'},
        { 'accountId': 'someid2', 'wallet': '', 'balance': 'balance'},
        { 'accountId': 'someid3', 'wallet': '', 'balance': 'balance'},
        { 'accountId': 'someid4', 'wallet': '', 'balance': 'balance'},
        { 'accountId': 'someid5', 'wallet': '', 'balance': 'balance'}
      ]);
      generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').returns([
        { 'accountId': 'someid1', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid2', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid3', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid4', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid5', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'}
      ]);
      generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').returns([
        { 'accountId': 'someid1', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid2', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid3', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid4', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'},
        { 'accountId': 'someid5', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'}
      ]);
      createAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAccount').resolves();
      logAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      logAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAccount').resolves();
      logAccountDividerStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountDivider').resolves();
      //privateKeyStub = sinon.stub(PrivateKey, 'generateECDSA').returns({'privateKey': 'some'} as any);
      logAliasAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccount').resolves();
      logAliasAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccountTitle').resolves();
      stateControllerStub = sinon.createStubInstance(StateController);
    })

    afterEach(() => {
      generateAliasECDSA.restore();
      generateECDSA.restore();
      generateED25519.restore();
      createAccountStub.restore();
      logAccountTitleStub.restore();
      //privateKeyStub.restore();
      logAccountStub.restore();
      logAccountDividerStub.restore();
      logAliasAccountStub.restore();
      logAliasAccountTitleStub.restore();
    })

    it('should generate accounts asynchronously and log the titles and dividers', async () => {
      cliServiceStub.getCurrentArgv.returns({
              async: true,
              blocklisting: false,
              balance: 1000,
              accounts: 5,
              startup: false,
            } as any);
      // Stub private methods
      await accountCreationState.subscribe(stateControllerStub);
      await accountCreationState.onStart();
      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateECDSA);
      sinon.assert.called(generateAliasECDSA);
      sinon.assert.called(generateED25519);
      sinon.assert.callCount(logAccountStub, 10);
      sinon.assert.callCount(logAliasAccountStub, 5);
      sinon.assert.called(logAliasAccountTitleStub);
      logAccountTitleStub.calledWithExactly(logAccountTitleStub.getCall(0),' ECDSA ');
      logAccountTitleStub.calledWithExactly(logAccountTitleStub.getCall(1),'ED25519');
      sinon.assert.called(stateControllerStub.update);
    });
  });
});

