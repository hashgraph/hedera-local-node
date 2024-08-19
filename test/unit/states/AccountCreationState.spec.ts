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
  ACCOUNT_CREATION_STATE_INIT_MESSAGE,
  SDK_ERRORS,
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

  afterEach(() => {
    loggerService.info.resetHistory();
    loggerService.warn.resetHistory();
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
      accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      commonAssertsForStart();
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);
    });

    it('should log information when starting in asynchronous mode', async () => {
      stubCliOptions({ async: true });

      accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      commonAssertsForStart();
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);
    });

    it('should log information when blocklisting is enabled', async () => {
      const getBlocklistedAccountsCountStub = testSandbox.stub(AccountCreationState.prototype, <any>'getBlocklistedAccountsCount').returns(1);
      stubCliOptions({ async: true, blocklisting: true });

      accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      commonAssertsForStart();
      testSandbox.assert.calledWith(loggerService.info, ACCOUNT_CREATION_STARTING_ASYNCHRONOUS_BLOCKLIST_MESSAGE, 'AccountCreationState');
      testSandbox.assert.called(getBlocklistedAccountsCountStub);
      testSandbox.assert.calledOnce(generateECDSAStub);
      testSandbox.assert.calledOnce(generateAliasECDSAStub);
      testSandbox.assert.calledOnce(generateED25519Stub);

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
    const accountInfo: AccountInfo = {
      accountId: expectedAccountId,
      balance: expectedBalance
    } as AccountInfo;

    let createAccountStub: SinonStub;
    let createAliasAccountStub: SinonStub;
    let logAccountStub: SinonStub;
    let logAccountTitleStub: SinonStub;
    let logAliasAccountStub: SinonStub;
    let logAliasAccountTitleStub: SinonStub;
    let logAccountDividerStub: SinonStub;
    let logAliasAccountDividerStub: SinonStub;
    let privateKeySpy: SinonSpy;

    beforeEach(() => {
      stubCliOptions({
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 5,
        startup: false,
      });
    });

    beforeEach(() => {
      createAccountStub = testSandbox.stub(AccountUtils, <any>'createAccount')
        .resolves(accountInfo);
      createAliasAccountStub = testSandbox.stub(AccountUtils, <any>'createAliasedAccount')
        .resolves(accountInfo);
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
      privateKeySpy.restore();
    })

    describe('generateECDSA', () => {
      let generateAliasECDSA: SinonStub;
      let generateED25519: SinonStub;
      let generateECDSA: SinonSpy;
  
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
      })
  
      it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);

        assertCreatedAccounts(5, 'ECDSA');
        testSandbox.assert.callCount(createAccountStub, 5);
      });

      it('should generate ECDSA accounts аsynchronously and log the title and divider', async () => {
        stubCliOptions({ async: true });

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateED25519);

        await generateECDSA.returnValues[0];

        assertCreatedAccounts(5, 'ECDSA');
        testSandbox.assert.callCount(createAccountStub, 5);
      });

      it('should retry the creation of ECDSA accounts if there is an error', async () => {
        const error = new Error(SDK_ERRORS.FAILED_TO_FIND_A_HEALTHY_NODE);
        const errorCount = 2;
        rejectWithError(createAccountStub, error, errorCount);

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccounts(accounts, 'ECDSA');
        assertRetries(createAccountStub, errorCount, error);
      });

      it('should not retry the creation of ECDSA accounts if there is an error which is not retryable', async () => {
        // Stub the createAccount method to throw an error
        // on the first two calls and then resolve any subsequent calls
        const error = new Error('Some other error');
        rejectWithError(createAccountStub, error, 2);

        accountCreationState.subscribe(observer);
        await assertThrowsError(() => accountCreationState.onStart(), error);

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccounts(accounts, 'ECDSA', false);
        assertRetries(createAccountStub, 0);
      });
    });
  
    describe('generateAliasECDSA', () => {
      let generateECDSA: SinonStub;
      let generateED25519: SinonStub;
      let generateAliasECDSA: SinonSpy;
  
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
      })
  
      it('should generate AliasECDSA accounts synchronously and log the title and divider', async () => {
        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);

        assertCreatedAccountAliases(5);
        testSandbox.assert.callCount(createAliasAccountStub, 5);
      });

      it('should generate AliasECDSA accounts asynchronously and log the title and divider', async () => {
        stubCliOptions({ async: true });

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);

        await generateAliasECDSA.returnValues[0];

        assertCreatedAccountAliases(5);
        testSandbox.assert.callCount(createAliasAccountStub, 5);
      });


      it('should retry the creation of AliasECDSA accounts if there is an error', async () => {
        const error = new Error(SDK_ERRORS.FAILED_TO_FIND_A_HEALTHY_NODE);
        const errorCount = 2;
        rejectWithError(createAliasAccountStub, error, errorCount);

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccountAliases(accounts);
        assertRetries(createAliasAccountStub, errorCount, error);
      });

      it('should not retry the creation of AliasECDSA accounts if there is an error which is not retryable', async () => {
        const error = new Error('Some other error');
        rejectWithError(createAliasAccountStub, error, 2);

        accountCreationState.subscribe(observer);
        await assertThrowsError(() => accountCreationState.onStart(), error);

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccountAliases(accounts, false);
        assertRetries(createAliasAccountStub, 0);
      });
    });
  
    describe('generateED25519', () => {
      let generateAliasECDSA: SinonStub;
      let generateECDSA: SinonStub;
      let generateED25519: SinonSpy;
  
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
      })
  
      it('should generate ED25519 accounts synchronously and log the title and divider', async () => {
        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);
        testSandbox.assert.callCount(createAccountStub, 5);
        assertCreatedAccounts(5, 'ED25519');
      });

      it('should generate ED25519 accounts asynchronously and log the title and divider', async () => {
        stubCliOptions({ async: true });

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        testSandbox.assert.called(generateAliasECDSA);
        testSandbox.assert.called(generateECDSA);
        testSandbox.assert.called(generateED25519);

        await generateED25519.returnValues[0];

        assertCreatedAccounts(5, 'ED25519');
        testSandbox.assert.callCount(createAccountStub, 5);
      });

      it('should retry the creation of ED25519 accounts if there is an error', async () => {
        const error = new Error(SDK_ERRORS.FAILED_TO_FIND_A_HEALTHY_NODE);
        const errorCount = 2;
        rejectWithError(createAccountStub, error, errorCount);

        accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccounts(accounts, 'ED25519');
        assertRetries(createAccountStub, errorCount, error);
      });

      it('should not retry the creation of ED25519 accounts if there is an error which is not retryable', async () => {
        const error = new Error('Some other error');
        rejectWithError(createAccountStub, error, 2);

        accountCreationState.subscribe(observer);
        await assertThrowsError(() => accountCreationState.onStart(), error);

        const accounts = cliService.getCurrentArgv().accounts;
        assertCreatedAccounts(accounts, 'ED25519', false);
        assertRetries(createAccountStub, 0);
      });
    });

    /**
     * Stubs the createAccount method to throw an error on the first two calls
     * and then resolve any subsequent calls
     *
     * @param stub The stub to reset and configure
     * @param error The error to throw
     * @param calls The number of calls to make before resolving
     */
    function rejectWithError(stub: SinonStub, error: Error, calls: number) {
      stub.reset();
      for (let i = 0; i < calls; i++) {
        stub.onCall(i).rejects(error);
      }
      stub.resolves(accountInfo);
    }

    function assertRetries(stub: SinonStub, retries: number, error?: Error) {
      const accounts = cliService.getCurrentArgv().accounts;

      // Assert that the task was retried until it succeeded
      testSandbox.assert.callCount(stub, accounts + retries);

      // Assert that the error was logged on each failure
      if (retries > 0) {
        testSandbox.assert.callCount(loggerService.warn, 2);
        for (const call of loggerService.warn.getCalls()) {
          expect(call.args[0]).to.equal(`Error occurred during task execution: "${error!.toString()}"`);
        }
      } else {
        testSandbox.assert.notCalled(loggerService.warn);
      }
    }

    function assertCreatedAccounts(accounts: number, accountType: string, success: boolean = true): void {
      commonAssertsForStart(success);
      testSandbox.assert.callCount(privateKeySpy, accounts);
      if (success) {
        testSandbox.assert.calledOnceWithExactly(logAccountTitleStub, accountType);
        testSandbox.assert.callCount(logAccountStub, accounts);
        testSandbox.assert.calledOnce(logAccountDividerStub);
      } else {
        testSandbox.assert.notCalled(logAccountTitleStub);
        testSandbox.assert.notCalled(logAccountStub);
        testSandbox.assert.notCalled(logAccountDividerStub);
      }
    }

    function assertCreatedAccountAliases(count: number, success: boolean = true): void {
      commonAssertsForStart(success);
      testSandbox.assert.callCount(privateKeySpy, count);
      if (success) {
        testSandbox.assert.calledOnce(logAliasAccountTitleStub);
        testSandbox.assert.callCount(logAliasAccountStub, count);
        testSandbox.assert.calledOnce(logAliasAccountDividerStub);
      } else {
        testSandbox.assert.notCalled(logAliasAccountTitleStub);
        testSandbox.assert.notCalled(logAliasAccountStub);
        testSandbox.assert.notCalled(logAliasAccountDividerStub);
      }
    }
  });

  function stubCliOptions(mockedOptions: Partial<CLIOptions>): void {
    cliService.getCurrentArgv.returns({
      ...cliService.getCurrentArgv(),
      ...mockedOptions,
    } as CLIOptions);
  }

  function commonAssertsForStart(success: boolean = true): void {
    testSandbox.assert.called(observer.update);
    if (success) {
      testSandbox.assert.calledTwice(loggerService.info);
    } else {
      testSandbox.assert.calledOnce(loggerService.info);
    }
  }

  async function assertThrowsError(fn: () => Promise<void>, error: Error): Promise<void> {
    try {
      await fn();
      expect.fail('Expected an exception to be thrown');
    } catch (e) {
      expect(e).to.equal(error);
    }
  }
});
