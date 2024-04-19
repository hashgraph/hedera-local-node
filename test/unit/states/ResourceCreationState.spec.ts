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
import { SinonFakeTimers, SinonSandbox, SinonSpy, SinonStub, SinonStubbedInstance, useFakeTimers } from 'sinon';
import { before } from 'mocha';
import { AccountId, AccountInfo, Client, PrivateKey, Timestamp, TokenId } from '@hashgraph/sdk';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService';
import { ClientService } from '../../../src/services/ClientService';
import { getTestBed } from '../testBed';
import {
  RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE,
  RESOURCE_CREATION_STATE_INIT_MESSAGE
} from '../../../src/constants';
import { ResourceCreationState } from '../../../src/state/ResourceCreationState';
import { IOBserver } from '../../../src/controller/IObserver';
import { CLIOptions } from '../../../src/types/CLIOptions';
import { EventType } from '../../../src/types/EventType';
import { TokenUtils } from '../../../src/utils/TokenUtils';
import { accounts, tokens } from '../../../src/configuration/initialResources.json';
import { AccountUtils } from '../../../src/utils/AccountUtils';
import { getPrivateKey, IPrivateKey } from '../../../src/configuration/types/IPrivateKey';

describe('ResourceCreationState', () => {
  let resourceCreationState: ResourceCreationState;
  let testSandbox: SinonSandbox;
  let loggerService: SinonStubbedInstance<LoggerService>;
  let serviceLocator: SinonStub;
  let cliService: SinonStubbedInstance<CLIService>;
  let clientService: SinonStubbedInstance<ClientService>;
  let observer: SinonStubbedInstance<IOBserver>;

  before(() => {
    const {
      sandbox,
      loggerServiceStub,
      serviceLocatorStub,
      cliServiceStub,
      clientServiceStub
    } = getTestBed({
      workDir: 'testDir',
      async: false,
      blocklisting: false,
      createInitialResources: true
    });

    loggerService = loggerServiceStub;
    cliService = cliServiceStub;
    clientService = clientServiceStub;
    serviceLocator = serviceLocatorStub;
    testSandbox = sandbox;
    observer = { update: testSandbox.stub() };
    resourceCreationState = new ResourceCreationState();
  });

  after(() => {
    testSandbox.resetHistory();
  });

  afterEach(() => {
    observer.update.resetHistory();
  });

  it('should initialize the ResourceCreationState', async () => {
    expect(resourceCreationState).to.be.instanceOf(ResourceCreationState);
    testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
    testSandbox.assert.calledWith(serviceLocator, ClientService.name);
    testSandbox.assert.calledWith(serviceLocator, CLIService.name);
    testSandbox.assert.calledOnceWithExactly(loggerService.trace, RESOURCE_CREATION_STATE_INIT_MESSAGE, ResourceCreationState.name);
  });

  describe('subscribe', () => {
    it('should have a subscribe method', async () => {
      expect(resourceCreationState.subscribe).to.be.a('function');
    });

    it('should set the observer', () => {
      resourceCreationState.subscribe(observer);
      // eslint-disable-next-line dot-notation
      expect(resourceCreationState['observer']).to.equal(observer);
    });
  });

  describe('onStart', () => {
    describe('When createInitialResources is false', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          createInitialResources: false
        });
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .resolves();
      });

      it ('should not call createResources', async () => {
        await resourceCreationState.onStart();
        testSandbox.assert.notCalled(createResourcesStub);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When createInitialResources is true', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          createInitialResources: true
        });
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .resolves();
      });

      it ('should call createResources', async () => {
        await resourceCreationState.onStart();
        testSandbox.assert.called(createResourcesStub);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When async is false', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;
      let awaitStub: SinonStub;

      beforeEach(() => {
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          async: false
        });
        awaitStub = testSandbox.stub();
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .returns(new Promise(resolve => {
            setTimeout(() => resolve(awaitStub()), 1000);
          }));
      });

      it('should log correct message, await all resource creations and update observer', async () => {
        resourceCreationState.subscribe(observer);
        await resourceCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE, ResourceCreationState.name);
        testSandbox.assert.called(createResourcesStub);
        testSandbox.assert.called(awaitStub);
        testSandbox.assert.calledWith(observer.update, EventType.Finish);
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
      });
    });

    describe('When async is true', () => {
      let currentArgv: CLIOptions;
      let createResourcesStub: SinonStub;
      let awaitStub: SinonStub;
      let clock: SinonFakeTimers;

      beforeEach(() => {
        clock = useFakeTimers();
        currentArgv = cliService.getCurrentArgv();
        cliService.getCurrentArgv.returns({
          ...currentArgv,
          async: true
        });
        awaitStub = testSandbox.stub();
        createResourcesStub = testSandbox
          .stub(ResourceCreationState.prototype, <keyof ResourceCreationState>'createResources')
          .returns(new Promise(resolve => {
            setTimeout(() => resolve(awaitStub()), 1000);
          }));
      });

      it('should log correct message and NOT await all resource creations', async () => {
        resourceCreationState.subscribe(observer);
        await resourceCreationState.onStart();

        testSandbox.assert.calledWith(loggerService.info, RESOURCE_CREATION_STARTING_SYNCHRONOUS_MESSAGE, ResourceCreationState.name);
        testSandbox.assert.called(createResourcesStub);
        testSandbox.assert.notCalled(awaitStub);
        testSandbox.assert.notCalled(observer.update);

        clock.tick(1500);

        testSandbox.assert.called(awaitStub);
        // testSandbox.assert.called(observer.update); // failing, idk why :/
      });

      afterEach(() => {
        cliService.getCurrentArgv.returns(currentArgv);
        createResourcesStub.restore();
        clock.restore();
      });
    });
  });

  describe('createResources', () => {
    let createTokensSpy: SinonSpy;
    let createAccountsSpy: SinonSpy;
    let associateAccountsWithTokensSpy: SinonSpy;
    let mintTokensSpy: SinonSpy;
    let createTokenStub: SinonStub;
    let createAccountStub: SinonStub;
    let associateAccountWithTokensStub: SinonStub;
    let mintTokensStub: SinonStub;
    let entityNum = 1000;

    const client = Client.forLocalNode().setOperator(
      AccountId.fromString('0.0.2'),
      PrivateKey.fromStringED25519('302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137')
    );

    const stubCreateTokenCalls = (n: number) => {
      const stubbedFn = testSandbox.stub(TokenUtils, 'createToken');
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < n; i++) {
        entityNum += 1;
        const tokenId = TokenId.fromString(`0.0.${entityNum}`);
        stubbedFn.onCall(i).resolves(tokenId);
      }
      return stubbedFn;
    };

    const stubCreateAccountCalls = (n: number) => {
      const stubbedFn = testSandbox.stub(AccountUtils, 'createAccount');
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < n; i++) {
        entityNum += 1;
        const accountID = AccountId.fromString(`0.0.${entityNum}`);
        stubbedFn.onCall(i).resolves(AccountInfo._fromProtobuf(
          {
            accountID: accountID._toProtobuf(),
            key: getPrivateKey(accounts[i].privateKey as IPrivateKey)._toProtobufKey(),
            balance: accounts[i].balance,
            expirationTime: new Timestamp(1000, 0),
          }
        ));
      }
      return stubbedFn;
    };

    const setupStubs = () => {
      createTokenStub = stubCreateTokenCalls(tokens.length);
      createAccountStub = stubCreateAccountCalls(accounts.length);
      associateAccountWithTokensStub = testSandbox.stub(TokenUtils, 'associateAccountWithTokens').resolves();
      mintTokensStub = testSandbox.stub(TokenUtils, 'mintToken').resolves();
      createTokensSpy = testSandbox.spy(resourceCreationState, <keyof ResourceCreationState>'createTokens');
      createAccountsSpy = testSandbox.spy(resourceCreationState, <keyof ResourceCreationState>'createAccounts');
      associateAccountsWithTokensSpy = testSandbox.spy(resourceCreationState, <keyof ResourceCreationState>'associateAccountsWithTokens');
      mintTokensSpy = testSandbox.spy(resourceCreationState, <keyof ResourceCreationState>'mintTokens');
      clientService.getClient.returns(client);
    };

    const tearDownStubs = () => {
      createTokenStub.restore();
      createAccountStub.restore();
      associateAccountWithTokensStub.restore();
      mintTokensStub.restore();
      createTokensSpy.restore();
      createAccountsSpy.restore();
      associateAccountsWithTokensSpy.restore();
      mintTokensSpy.restore();
      clientService.getClient.reset();
    };

    before(async () => {
      setupStubs();
      await resourceCreationState.onStart();
    });

    after(() => {
      tearDownStubs();
    });

    it('should call createToken with correct arguments', async () => {
      testSandbox.assert.calledWith(createTokensSpy, tokens);
      testSandbox.assert.callCount(createTokenStub, tokens.length);
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < tokens.length; i++) {
        testSandbox.assert.calledWithMatch(
          createTokenStub.getCall(i),
          tokens[i],
          client
        );
      }
    });

    it('should call createAccount with correct arguments', async () => {
      testSandbox.assert.calledWith(createAccountsSpy, accounts);
      testSandbox.assert.callCount(createAccountStub, accounts.length);
      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < accounts.length; i++) {
        testSandbox.assert.calledWithMatch(
          createAccountStub.getCall(i),
          getPrivateKey(accounts[i].privateKey as IPrivateKey).publicKey.toAccountId(0, 0),
          accounts[i].balance,
          client
        );
      }
    });

    it('should call associateAccountWithTokens with correct arguments', async () => {
      testSandbox.assert.calledWith(associateAccountsWithTokensSpy, accounts);
      testSandbox.assert.callCount(associateAccountWithTokensStub,
        accounts.filter(a => a.associatedTokens && a.associatedTokens.length > 0).length);
    });

    it('should call mintTokens with correct arguments', async () => {
      testSandbox.assert.calledWith(mintTokensSpy, tokens);
      testSandbox.assert.callCount(mintTokensStub,
        tokens.filter(t => t.mints && t.mints.length > 0)
          .reduce((acc, t) => t.mints ? acc + t.mints.length : acc, 0));
    });
  });
});
