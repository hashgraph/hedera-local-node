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
import sinon from 'sinon';
import { AccountCreationState } from '../../../src/state/AccountCreationState';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService'
import { ClientService } from '../../../src/services/ClientService';
import { ServiceLocator } from '../../../src/services/ServiceLocator';
import { PrivateKey } from '@hashgraph/sdk';

describe('AccountCreationState', () => {
  let accountCreationState: AccountCreationState;
  let loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
  let cliServiceStub: sinon.SinonStubbedInstance<CLIService>;
  let clientServiceStub: sinon.SinonStubbedInstance<ClientService>;
  let serviceLocatorStub: sinon.SinonStub;
  const observer = { update: sinon.stub() };

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
      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
      sinon.assert.called(generateECDSAStub);
      sinon.assert.called(generateAliasECDSA);
      sinon.assert.called(generateED25519);
      sinon.assert.called(observer.update);
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

      await accountCreationState.subscribe(observer);
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
      await accountCreationState.subscribe(observer);
      await accountCreationState.onStart();

      sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode with 1 blocklisted accounts', 'AccountCreationState');
      sinon.assert.called(generateAsyncStub);
      sinon.assert.called(getBlocklistedAccountsCountStub);
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
    let logAccountTitleStub: sinon.SinonStub;
    let createAccountStub: sinon.SinonStub;
    let logAliasAccountStub: sinon.SinonStub;
    let logAliasAccountTitleStub: sinon.SinonStub;
    let logAccountDividerStub: sinon.SinonStub;
    let createAccountAsyncStub: sinon.SinonStub;

    beforeEach(() => {
      logAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountTitle').resolves();
      createAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAccount').resolves();
      logAliasAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccount').resolves();
      logAliasAccountTitleStub = sinon.stub(AccountCreationState.prototype, <any>'logAliasAccountTitle').resolves();
      logAccountDividerStub = sinon.stub(AccountCreationState.prototype, <any>'logAccountDivider').resolves();
      createAccountAsyncStub = sinon.stub(AccountCreationState.prototype, <any>'createAccountAsync');
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
      let generateAliasECDSA: sinon.SinonStub;
      let generateED25519: sinon.SinonStub;
      let privateKeyStub: sinon.SinonStub;
  
      beforeEach(() => {
        generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        privateKeyStub = sinon.stub(PrivateKey, 'generateECDSA').returns({'privateKey': 'some'} as any);
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateED25519.restore();
        privateKeyStub.restore();
      })
  
      it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
        cliServiceStub.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 5,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateAliasECDSA);
        sinon.assert.called(generateED25519);
        sinon.assert.callCount(privateKeyStub, 5);
        sinon.assert.calledOnce(logAccountTitleStub);
        sinon.assert.called(observer.update);
        sinon.assert.called(logAccountDividerStub);
        sinon.assert.callCount(createAccountAsyncStub, 5);
      });

      it('should generate ECDSA accounts аsynchronously and log the title and divider', async () => {
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateAliasECDSA);
        sinon.assert.called(generateED25519);
        sinon.assert.callCount(privateKeyStub, 10);
        sinon.assert.callCount(createAccountStub, 10);
        sinon.assert.calledOnce(logAccountTitleStub);
        sinon.assert.called(observer.update);
        sinon.assert.called(logAccountDividerStub);
      });
    });
  
    describe('generateAliasECDSA', () => {
      let generateECDSA: sinon.SinonStub;
      let generateED25519: sinon.SinonStub;
      let createAliasAccountStub: sinon.SinonStub;
  
      beforeEach(() => {
        generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').resolves();
        createAliasAccountStub = sinon.stub(AccountCreationState.prototype, <any>'createAliasAccount').returns({
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
  
      it('should generate ECDSA accounts synchronously and log the title and divider', async () => {
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateECDSA);
        sinon.assert.called(generateED25519);
        sinon.assert.callCount(logAliasAccountStub, 10);
        sinon.assert.callCount(createAliasAccountStub, 10);
        sinon.assert.calledOnce(logAliasAccountTitleStub);
        sinon.assert.called(observer.update);
      });

      it('should generate ECDSA accounts asynchronously and log the title and divider', async () => {
        cliServiceStub.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 6,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateECDSA);
        sinon.assert.called(generateED25519);
        sinon.assert.callCount(createAliasAccountStub, 6);
        sinon.assert.called(observer.update);
      });
    });
  
    describe('generateED25519', () => {
      let generateAliasECDSA: sinon.SinonStub;
      let generateECDSA: sinon.SinonStub;
      let privateKeyStub: sinon.SinonStub;
  
      beforeEach(() => {
        generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').resolves();
        generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').resolves();
        privateKeyStub = sinon.stub(PrivateKey, 'generateED25519').returns({'privateKey': 'some'} as any);
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateECDSA.restore();
        privateKeyStub.restore();
      })
  
      it('should generate ED25519 accounts synchronously and log the title and divider', async () => {
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in synchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateAliasECDSA);
        sinon.assert.called(generateECDSA);
        sinon.assert.callCount(privateKeyStub, 10);
        sinon.assert.callCount(createAccountStub, 10);
        sinon.assert.calledOnceWithExactly(logAccountTitleStub, 'ED25519');
        sinon.assert.called(observer.update);
      });

      it('should generate ED25519 accounts asynchronously and log the title and divider', async () => {
        cliServiceStub.getCurrentArgv.returns({
          async: true,
          blocklisting: false,
          balance: 1000,
          accounts: 6,
          startup: false,
        } as any);
        await accountCreationState.subscribe(observer);
        await accountCreationState.onStart();

        sinon.assert.calledWith(loggerServiceStub.info, 'Starting Account Creation state in asynchronous mode ', 'AccountCreationState');
        sinon.assert.called(generateAliasECDSA);
        sinon.assert.called(generateECDSA);
        sinon.assert.callCount(privateKeyStub, 6);
        sinon.assert.callCount(createAccountAsyncStub, 6);
        sinon.assert.called(observer.update);
      });
    });
  
    describe('generateAsync', () => {
      let generateAliasECDSA: sinon.SinonStub;
      let generateECDSA: sinon.SinonStub;
      let generateED25519: sinon.SinonStub;
      let logAccountStub: sinon.SinonStub;
  
      beforeEach(() => {
        const account = { 'accountId': 'someid', 'wallet': {'signingKey': {'privateKey': ''}}, 'balance': 'balance'};
        generateAliasECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateAliasECDSA').returns([
          { 'accountId': 'someid1', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid2', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid3', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid4', 'wallet': '', 'balance': 'balance'},
          { 'accountId': 'someid5', 'wallet': '', 'balance': 'balance'}
        ]);
        generateED25519 = sinon.stub(AccountCreationState.prototype, <any>'generateED25519').returns([
          account,
          account,
          account,
          account,
          account
        ]);
        generateECDSA = sinon.stub(AccountCreationState.prototype, <any>'generateECDSA').returns([
          account,
          account,
          account,
          account,
          account
        ]);
        logAccountStub = sinon.stub(AccountCreationState.prototype, <any>'logAccount').resolves();
      })
  
      afterEach(() => {
        generateAliasECDSA.restore();
        generateECDSA.restore();
        generateED25519.restore();
        logAccountStub.restore();
      })
  
      it('should generate accounts asynchronously and log the titles and dividers', async () => {
        cliServiceStub.getCurrentArgv.returns({
                async: true,
                blocklisting: false,
                balance: 1000,
                accounts: 5,
                startup: false,
              } as any);
        await accountCreationState.subscribe(observer);
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
        sinon.assert.called(observer.update);
        sinon.assert.calledTwice(logAccountDividerStub);
      });
    });
  })
});

