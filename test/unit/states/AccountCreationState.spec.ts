/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { expect } from 'chai';
import { AccountCreationState } from '../../../src/state/AccountCreationState';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService'
import { ClientService } from '../../../src/services/ClientService';
import { PrivateKey } from '@hashgraph/sdk';
import { getTestBed } from '../testBed';
import { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { ACCOUNT_CREATION_STATE_INIT_MESSAGE, ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE,
         ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE,
         ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE } from '../../../src/constants';

describe('AccountCreationState', () => {
  let accountCreationState: AccountCreationState,
      testSandbox: SinonSandbox, 
      loggerService: SinonStubbedInstance<LoggerService>,
      serviceLocator: SinonStub,
      cliService: SinonStubbedInstance<CLIService>,
      observer;

  before(() => {
    const { 
      sandbox,
      loggerServiceStub,
      serviceLocatorStub,
      cliServiceStub
    } = getTestBed({
      workDir: 'testDir',
      async: false,
      blocklisting: false
    });

    loggerService = loggerServiceStub;
    cliService = cliServiceStub;
    serviceLocator = serviceLocatorStub;
    testSandbox = sandbox;
    observer = { update: testSandbox.stub() };
    accountCreationState = new AccountCreationState();
  });

  after(() => {
    testSandbox.resetHistory();
  })

  it('should initialize the Init State', async () => {
    expect(accountCreationState).to.be.instanceOf(AccountCreationState);
    testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
    testSandbox.assert.calledWith(serviceLocator, ClientService.name);
    testSandbox.assert.calledWith(serviceLocator, CLIService.name);
    testSandbox.assert.calledOnceWithExactly(loggerService.trace, ACCOUNT_CREATION_STATE_INIT_MESSAGE, AccountCreationState.name);
})

it('should have a subscribe method', async () => {
    expect(accountCreationState.subscribe).to.be.a('function');
})

  describe('onStart', () => {
    it('should log information when starting in synchronous mode', async () => {
      const generateECDSAStub = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      const generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
      const generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE, 'AccountCreationState');
      testSandbox.assert.called(generateECDSAStub);
      testSandbox.assert.called(generateAliasECDSA);
      testSandbox.assert.called(generateED25519);
      testSandbox.assert.called(observer.update);
      generateECDSAStub.restore();
      generateAliasECDSA.restore();
      generateED25519.restore();
    });

    it('should log information when starting in asynchronous mode', async () => {
      cliService.getCurrentArgv.returns({
        async: true,
        blocklisting: false,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);
      const generateAsyncStub = testSandbox.stub(AccountCreationState.prototype, <any>'generateAsync').resolves();

      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();
      testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE, 'AccountCreationState');
      testSandbox.assert.called(generateAsyncStub);
      generateAsyncStub.restore();
    });

    it('should log information when blocklisting is enabled', async () => {
      cliService.getCurrentArgv.returns({
        async: true,
        blocklisting: true,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);

      const getBlocklistedAccountsCountStub = testSandbox.stub(AccountCreationState.prototype, <any>'getBlocklistedAccountsCount').returns(1);
      const generateAsyncStub = testSandbox.stub(AccountCreationState.prototype, <any>'generateAsync').resolves();
      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE, 'AccountCreationState');
      testSandbox.assert.called(generateAsyncStub);
      testSandbox.assert.called(getBlocklistedAccountsCountStub);
      getBlocklistedAccountsCountStub.restore();
      generateAsyncStub.restore();
    });
  });

  describe('subscribe', () => {
    it('should set the observer', () => {
      accountCreationState.subscribe(observer);
      expect(accountCreationState['observer']).to.equal(observer);
    });
  });

  describe('generate methods', () => {
    let logAccountTitleStub: SinonStub;
    let createAccountStub: SinonStub;
    let logAliasAccountStub: SinonStub;
    let logAliasAccountTitleStub: SinonStub;
    let logAccountDividerStub: SinonStub;
    let createAccountAsyncStub: SinonStub;

    beforeEach(() => {
      logAccountTitleStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      createAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'createAccount').resolves();
      logAliasAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAliasAccount').resolves();
      logAliasAccountTitleStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAliasAccountTitle').resolves();
      logAccountDividerStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccountDivider').resolves();
      createAccountAsyncStub = testSandbox.stub(AccountCreationState.prototype, <any>'createAccountAsync');
    })

    afterEach(() => {
      logAccountTitleStub.restore();
      createAccountStub.restore();
      logAliasAccountStub.restore();
      logAliasAccountTitleStub.restore();
      logAccountDividerStub.restore();
      createAccountAsyncStub.restore();
    })

    describe('generateECDSA', () => {
      let generateAliasECDSA: SinonStub;
      let generateED25519: SinonStub;
      let privateKeyStub: SinonStub;
  
      beforeEach(() => {
        generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        privateKeyStub = testSandbox.stub(PrivateKey, 'generateECDSA').returns({'privateKey': 'some'} as any);
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateED25519.restore();
        privateKeyStub.restore();
      })
  
      it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: false,
          blocklisting: false,
          balance: 1000,
          accounts: 5,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(privateKeyStub, 5);
        testSandbox.assert.calledOnce(logAccountTitleStub);
        testSandbox.assert.called(observer.update);
        testSandbox.assert.called(logAccountDividerStub);
        testSandbox.assert.callCount(createAccountStub, 5);
      });

      it('should generate ECDSA accounts аsynchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 10,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(privateKeyStub, 10);
        testSandbox.assert.callCount(createAccountAsyncStub, 10);
        testSandbox.assert.calledOnce(logAccountTitleStub);
        testSandbox.assert.called(observer.update);
        testSandbox.assert.called(logAccountDividerStub);
      });
    });
  
    describe('generateAliasECDSA', () => {
      let generateECDSA: SinonStub;
      let generateED25519: SinonStub;
      let createAliasAccountStub: SinonStub;
  
      beforeEach(() => {
        generateECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        createAliasAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'createAliasAccount').returns({
          'accountId': 'someid',
          'wallet': {'signingKey': {'privateKey': ''}},
          'balance': 'balance'
        });
      })
  
      afterEach(() => {
        generateECDSA.restore();
        generateED25519.restore();
        createAliasAccountStub.restore();
      })
  
      it('should generate AliasECDSA accounts synchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: false,
          blocklisting: false,
          balance: 1000,
          accounts: 10,
          startup: false,
        } as any);
        
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(logAliasAccountStub, 10);
        testSandbox.assert.callCount(createAliasAccountStub, 10);
        testSandbox.assert.calledOnce(logAliasAccountTitleStub);
        testSandbox.assert.called(observer.update);
      });

      it('should generate AliasECDSA accounts asynchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 6,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(createAliasAccountStub, 6);
        testSandbox.assert.called(observer.update);
      });
    });
  
    describe('generateED25519', () => {
      let generateAliasECDSA: SinonStub;
      let generateECDSA: SinonStub;
      let privateKeyStub: SinonStub;
  
      beforeEach(() => {
        generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        privateKeyStub = testSandbox.stub(PrivateKey, 'generateED25519').returns({'privateKey': 'some'} as any);
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateECDSA.restore();
        privateKeyStub.restore();
      })
  
      it('should generate ED25519 accounts synchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: false,
          blocklisting: false,
          balance: 1000,
          accounts: 10,
          startup: false,
        } as any);

        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_SYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.callCount(privateKeyStub, 10);
        testSandbox.assert.callCount(createAccountStub, 10);
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, 'ED25519');
        testSandbox.assert.called(observer.update);
      });

      it('should generate ED25519 accounts asynchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 6,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.callCount(privateKeyStub, 6);
        testSandbox.assert.callCount(createAccountAsyncStub, 6);
        testSandbox.assert.called(observer.update);
      });
    });
  
    describe('generateAsync', () => {
      let generateAliasECDSA: SinonStub;
      let generateECDSA: SinonStub;
      let generateED25519: SinonStub;
      let logAccountStub: SinonStub;
  
      beforeEach(() => {
        const account = { 'accountId': 'someid', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'};
        generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').returns([
          { 'accountId': 'someid1', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid2', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid3', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid4', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid5', 'wallet': '', 'balance': 'balance'}
        ]);
        generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').returns([
          account,
          account,
          account,
          account,
          account
        ]);
        generateECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').returns([
          account,
          account,
          account,
          account,
          account
        ]);
        logAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccount').resolves();
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateECDSA.restore();
        generateED25519.restore();
        logAccountStub.restore();
      })
  
      it('should generate accounts asynchronously and log the titles and dividers', async () => {
        cliService.getCurrentArgv.returns({
                async: true,
                blocklisting: false,
                balance: 1000,
                accounts: 5,
                startup: false,
              } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_MESSAGE, 'AccountCreationState');
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(logAccountStub, 10);
        testSandbox.assert.callCount(logAliasAccountStub, 5);
        testSandbox.assert.called(logAliasAccountTitleStub);
        logAccountTitleStub.calledWithExactly(logAccountTitleStub.getCall(0),' ECDSA ');
        logAccountTitleStub.calledWithExactly(logAccountTitleStub.getCall(1),'ED25519');
        testSandbox.assert.called(observer.update);
        testSandbox.assert.calledTwice(logAccountDividerStub);
      });
    });
  })
});

