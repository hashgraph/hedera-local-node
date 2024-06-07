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
import { CLIService } from '../../../src/services/CLIService';
import { ClientService } from '../../../src/services/ClientService';
import { AccountId, AccountInfo, EvmAddress, Hbar, PrivateKey } from '@hashgraph/sdk';
import { getTestBed } from '../testBed';
import { SinonSandbox, SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';
import {
  ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE,
  ACCOUNT_CREATION_STATE_INIT_MESSAGE
} from '../../../src/constants';
import { IOBserver } from '../../../src/controller/IObserver';
import { AccountUtils } from '../../../src/utils/AccountUtils';
import { CLIOptions } from '../../../src/types/CLIOptions';

describe('AccountCreationState', () => {
  let accountCreationState: AccountCreationState,
      testSandbox: SinonSandbox, 
      loggerService: SinonStubbedInstance<LoggerService>,
      serviceLocator: SinonStub,
      cliService: SinonStubbedInstance<CLIService>,
      observer: SinonStubbedInstance<IOBserver>;

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
  });

  it('should initialize the Init State', async () => {
    expect(accountCreationState).to.be.instanceOf(AccountCreationState);
    testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
    testSandbox.assert.calledWith(serviceLocator, ClientService.name);
    testSandbox.assert.calledWith(serviceLocator, CLIService.name);
    testSandbox.assert.calledOnceWithExactly(loggerService.trace, ACCOUNT_CREATION_STATE_INIT_MESSAGE, AccountCreationState.name);
  });

  it('should have a subscribe method', async () => {
      expect(accountCreationState.subscribe).to.be.a('function');
  });

  describe('onStart', () => {
    let generateECDSAStub: SinonStub;
    let generateAliasECDSAStub: SinonStub;
    let generateED25519Stub: SinonStub;

    beforeEach(() => {
      generateECDSAStub = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
      generateAliasECDSAStub = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
      generateED25519Stub = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
    });

    afterEach(() => {
      generateECDSAStub.restore();
      generateAliasECDSAStub.restore();
      generateED25519Stub.restore();
    });

    it('should log information when starting in synchronous mode', async () => {
      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      testSandbox.assert.calledTwice(loggerService.info);
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);
      testSandbox.assert.called(observer.update);
    });

    it('should log information when starting in asynchronous mode', async () => {
      cliService.getCurrentArgv.returns({
        async: true,
        blocklisting: false,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);

      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      testSandbox.assert.callCount(loggerService.info, 4);
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);
      testSandbox.assert.called(observer.update);
    });

    it('should log information when blocklisting is enabled', async () => {
      const getBlocklistedAccountsCountStub = testSandbox.stub(AccountCreationState.prototype, <any>'getBlocklistedAccountsCount').returns(1);
      cliService.getCurrentArgv.returns({
        async: true,
        blocklisting: true,
        balance: 1000,
        accounts: 5,
        startup: false,
      } as any);

      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE, 'AccountCreationState');
      testSandbox.assert.called(getBlocklistedAccountsCountStub);
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);
      testSandbox.assert.called(observer.update);

      getBlocklistedAccountsCountStub.restore();
    });
  });

  describe('subscribe', () => {
    it('should set the observer', () => {
      accountCreationState.subscribe(observer);
      expect(accountCreationState['observer']).to.equal(observer);
    });
  });

  describe('generate methods', () => {
    const expectedAccountId: AccountId = AccountId.fromString('0.0.1234');
    expectedAccountId.evmAddress = EvmAddress.fromString('0x1234');
    const expectedBalance: Hbar = new Hbar(1000);

    let createAccountStub: SinonStub;
    let createAliasAccountStub: SinonStub;
    let logAccountStub: SinonStub;
    let logAccountTitleStub: SinonStub;
    let logAliasAccountStub: SinonStub;
    let logAliasAccountTitleStub: SinonStub;
    let logAccountDividerStub: SinonStub;
    let logAliasAccountDividerStub: SinonStub;

    beforeEach(() => {
      createAccountStub = testSandbox.stub(AccountUtils, <any>'createAccount')
        .resolves({ accountId: expectedAccountId, balance: expectedBalance } as AccountInfo);
      createAliasAccountStub = testSandbox.stub(AccountUtils, <any>'createAliasedAccount')
        .resolves({ accountId: expectedAccountId, balance: expectedBalance } as AccountInfo);
      logAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccount').resolves();
      logAccountTitleStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      logAliasAccountStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAliasAccount').resolves();
      logAliasAccountTitleStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAliasAccountTitle').resolves();
      logAccountDividerStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAccountDivider').resolves();
      logAliasAccountDividerStub = testSandbox.stub(AccountCreationState.prototype, <any>'logAliasAccountDivider').resolves();
    })

    afterEach(() => {
      logAccountStub.restore();
      logAccountTitleStub.restore();
      createAccountStub.restore();
      createAliasAccountStub.restore();
      logAliasAccountStub.restore();
      logAliasAccountTitleStub.restore();
      logAccountDividerStub.restore();
      logAliasAccountDividerStub.restore();
    })

    describe('generateECDSA', () => {
      let generateAliasECDSA: SinonStub;
      let generateED25519: SinonStub;
      let generateECDSA: SinonSpy;
      let privateKeySpy: SinonSpy;
  
      beforeEach(() => {
        generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        generateECDSA = testSandbox.spy(AccountCreationState.prototype, <any>'generateECDSA');
        privateKeySpy = testSandbox.spy(PrivateKey, 'generateECDSA');
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateED25519.restore();
        generateECDSA.restore();
        privateKeySpy.restore();
      })
  
      it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
        cliService.getCurrentArgv.returns({
          async: false,
          blocklisting: false,
          balance: 1000,
          accounts: 5,
          startup: false,
        } as CLIOptions);

        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.callCount(loggerService.info, 8);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        testSandbox.assert.callCount(privateKeySpy, 5);
        testSandbox.assert.callCount(createAccountStub, 5);
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, 'ECDSA');
        testSandbox.assert.callCount(logAccountStub, 5);
        testSandbox.assert.calledOnce(logAccountDividerStub);
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

        testSandbox.assert.callCount(loggerService.info, 10);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        await generateECDSA.returnValues[0];

        testSandbox.assert.callCount(privateKeySpy, 10);
        testSandbox.assert.callCount(createAccountStub, 10);
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, 'ECDSA');
        testSandbox.assert.callCount(logAccountStub, 10);
        testSandbox.assert.calledOnce(logAccountDividerStub);
      });
    });
  
    describe('generateAliasECDSA', () => {
      let generateECDSA: SinonStub;
      let generateED25519: SinonStub;
      let generateAliasECDSA: SinonSpy;
      let privateKeySpy: SinonSpy;
  
      beforeEach(() => {
        generateECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        generateED25519 = testSandbox.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        generateAliasECDSA = testSandbox.spy(AccountCreationState.prototype, <any>'generateAliasECDSA');
        privateKeySpy = testSandbox.spy(PrivateKey, 'generateECDSA');
      })
  
      afterEach(() => {
        generateECDSA.restore();
        generateED25519.restore();
        generateAliasECDSA.restore();
        privateKeySpy.restore();
        loggerService.info.resetHistory()
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

        testSandbox.assert.callCount(loggerService.info, 12);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        testSandbox.assert.callCount(privateKeySpy, 10);
        testSandbox.assert.callCount(createAliasAccountStub, 10);
        testSandbox.assert.calledOnce(logAliasAccountTitleStub);
        testSandbox.assert.callCount(logAliasAccountStub, 10);
        testSandbox.assert.calledOnce(logAliasAccountDividerStub);
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

        testSandbox.assert.callCount(loggerService.info, 2);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        await generateAliasECDSA.returnValues[0];

        testSandbox.assert.callCount(privateKeySpy, 6);
        testSandbox.assert.callCount(createAliasAccountStub, 6);
        testSandbox.assert.calledOnce(logAliasAccountTitleStub);
        testSandbox.assert.callCount(logAliasAccountStub, 6);
        testSandbox.assert.calledOnce(logAliasAccountDividerStub);
      });
    });
  
    describe('generateED25519', () => {
      let generateAliasECDSA: SinonStub;
      let generateECDSA: SinonStub;
      let generateED25519: SinonSpy;
      let privateKeySpy: SinonSpy;
  
      beforeEach(() => {
        generateAliasECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateECDSA = testSandbox.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        generateED25519 = testSandbox.spy(AccountCreationState.prototype, <any>'generateED25519');
        privateKeySpy = testSandbox.spy(PrivateKey, 'generateED25519');
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateECDSA.restore();
        generateED25519.restore();
        privateKeySpy.restore();
        loggerService.info.resetHistory();
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

        testSandbox.assert.callCount(loggerService.info, 2);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        testSandbox.assert.callCount(privateKeySpy, 10);
        testSandbox.assert.callCount(createAccountStub, 10);
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, 'ED25519');
        testSandbox.assert.callCount(logAccountStub, 10);
        testSandbox.assert.calledOnce(logAccountDividerStub);
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

        testSandbox.assert.callCount(loggerService.info, 2);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.called(observer.update);

        await generateED25519.returnValues[0];

        testSandbox.assert.callCount(privateKeySpy, 6);
        testSandbox.assert.callCount(createAccountStub, 6);
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, 'ED25519');
        testSandbox.assert.callCount(logAccountStub, 6);
        testSandbox.assert.calledOnce(logAccountDividerStub);
      });
    });
  })
});
