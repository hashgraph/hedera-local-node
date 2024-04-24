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

import { AccountUtils } from '../../../src/utils/AccountUtils';
import {
  AccountCreateTransaction,
  AccountId,
  AccountInfo,
  AccountInfoQuery,
  Client,
  Hbar,
  Key,
  PrivateKey,
  TransactionResponse,
  TransferTransaction
} from '@hashgraph/sdk';
import { getTestBed, LocalNodeTestBed } from '../testBed';
import { SinonStub } from 'sinon';
import { before } from 'mocha';
import { IAccountProps } from '../../../src/configuration/types/IAccountProps';
import { getPrivateKey, KeyType } from '../../../src/configuration/types/IPrivateKey';
import { toIPrivateKey } from '../../testUtils';

describe(AccountUtils.name, () => {
  let testBed: LocalNodeTestBed;
  let client: Client;

  before(() => {
    testBed = getTestBed();
    client = testBed.clientServiceStub.getClient();
  });

  after(() => {
    testBed.sandbox.resetHistory();
  });

  describe('createAccountFromProps', () => {
    const accountWithNoKey: IAccountProps = {
      balance: 100
    };
    const accountWithECDSAKey: IAccountProps = {
      privateKey: toIPrivateKey(PrivateKey.generateECDSA()),
      balance: 100
    };
    const accountWithED25519Key: IAccountProps = {
      privateKey: toIPrivateKey(PrivateKey.generateED25519()),
      balance: 100
    };

    for (const account of [accountWithNoKey, accountWithECDSAKey, accountWithED25519Key]) {
      const keyType = account.privateKey?.type;

      describe(`when the given account props have ${keyType || 'no'} key`, () => {
        const expectedAccountId: AccountId = AccountId.fromString('0.0.1234');
        const expectedBalance: Hbar = new Hbar(account.balance);
        const expectedFnCall: string = keyType === KeyType.ED25519 ? 'createAccount' : 'createAliasedAccount';

        let createAccountStub: SinonStub;
        let createAliasedAccountStub: SinonStub;

        before(() => {
          createAccountStub = testBed.sandbox.stub(AccountUtils, 'createAccount')
            .resolves({ accountId: expectedAccountId, balance: expectedBalance } as AccountInfo);
          createAliasedAccountStub = testBed.sandbox.stub(AccountUtils, 'createAliasedAccount')
            .resolves({ accountId: expectedAccountId, balance: expectedBalance } as AccountInfo);
        });

        after(() => {
          createAccountStub.restore();
          createAliasedAccountStub.restore();
        });

        it(`should create an account using ${expectedFnCall}()`, async () => {
          const { accountInfo, privateKey } = await AccountUtils.createAccountFromProps(account, client);

          // verify returned account info is correct
          testBed.sandbox.assert.match(accountInfo.accountId, expectedAccountId);
          testBed.sandbox.assert.match(accountInfo.balance, expectedBalance);

          // verify returned private key is correct
          if (account.privateKey) {
            const expectedPrivateKey = getPrivateKey(account.privateKey);
            testBed.sandbox.assert.match(privateKey, expectedPrivateKey);
          } else {
            testBed.sandbox.assert.match(privateKey, testBed.sandbox.match.instanceOf(PrivateKey));
            testBed.sandbox.assert.match(privateKey.type, 'secp256k1');
            testBed.sandbox.assert.match(privateKey.toString(), testBed.sandbox.match.truthy);
          }

          // verify correct account create transaction is called
          if (keyType === KeyType.ED25519) {
            testBed.sandbox.assert.calledOnce(createAccountStub);
            testBed.sandbox.assert.notCalled(createAliasedAccountStub);
          } else {
            testBed.sandbox.assert.notCalled(createAccountStub);
            testBed.sandbox.assert.calledOnce(createAliasedAccountStub);
          }
        });
      });
    }
  });

  describe('createAliasedAccount', () => {
    const aliasedAccountId: AccountId = AccountId.fromEvmAddress(0, 0, '0x123456');
    const accountId: AccountId = AccountId.fromString('0.0.1234');
    const balance: number = 100;

    // TransferTransaction stubs
    let addHbarTransferStub: SinonStub<[accountId: string | AccountId, amount: Hbar], TransferTransaction>;
    let executeTransferStub: SinonStub<[client: any, requestTimeout?: number], Promise<TransactionResponse>>;

    // AccountInfoQuery stubs
    let setAccountIdStub: SinonStub<[accountId: string | AccountId], AccountInfoQuery>;
    let executeAccountInfoQueryStub: SinonStub<[client: any, requestTimeout?: number], Promise<AccountInfo>>;

    before(() => {
      addHbarTransferStub = testBed.sandbox.stub(TransferTransaction.prototype, 'addHbarTransfer').returnsThis();
      executeTransferStub = testBed.sandbox.stub(TransferTransaction.prototype, 'execute')
        .resolves({ getReceipt: testBed.sandbox.stub().resolves() } as unknown as TransactionResponse);
      setAccountIdStub = testBed.sandbox.stub(AccountInfoQuery.prototype, 'setAccountId').returnsThis();
      executeAccountInfoQueryStub = testBed.sandbox.stub(AccountInfoQuery.prototype, 'execute')
        .resolves({ accountId, balance: new Hbar(balance) } as AccountInfo);
    });

    after(() => {
      addHbarTransferStub.restore();
      executeTransferStub.restore();
      setAccountIdStub.restore();
      executeAccountInfoQueryStub.restore();
    });

    it('should create an aliased account', async () => {
      const accountInfo = await AccountUtils.createAliasedAccount(aliasedAccountId, balance, client);
      testBed.sandbox.assert.match(accountInfo.accountId, accountId);
      testBed.sandbox.assert.match(accountInfo.balance, new Hbar(balance));

      // TransferTransaction
      testBed.sandbox.assert.calledTwice(addHbarTransferStub);
      testBed.sandbox.assert.calledWith(addHbarTransferStub, client.operatorAccountId!, new Hbar(balance).negated());
      testBed.sandbox.assert.calledWith(addHbarTransferStub, aliasedAccountId, new Hbar(balance));
      testBed.sandbox.assert.calledWith(executeTransferStub, client);

      // AccountInfoQuery
      testBed.sandbox.assert.calledOnceWithExactly(setAccountIdStub, aliasedAccountId);
      testBed.sandbox.assert.calledWith(executeAccountInfoQueryStub, client);
    });
  });

  describe('createAccount', () => {
    const publicKey = PrivateKey.generateECDSA().publicKey;
    const accountId: AccountId = AccountId.fromString('0.0.1234');
    const balance: number = 100;

    // AccountCreateTransaction stubs
    let setKeyStub: SinonStub<[key: Key], AccountCreateTransaction>;
    let setInitialBalanceStub: SinonStub<[balance: Hbar], AccountCreateTransaction>;
    let executeAccountCreateTransactionStub: SinonStub<[client: any, requestTimeout?: number], Promise<TransactionResponse>>;

    // AccountInfoQuery stubs
    let setAccountIdStub: SinonStub<[accountId: string | AccountId], AccountInfoQuery>;
    let executeAccountInfoQueryStub: SinonStub<[client: any, requestTimeout?: number], Promise<AccountInfo>>;

    before(() => {
      setKeyStub = testBed.sandbox.stub(AccountCreateTransaction.prototype, 'setKey').returnsThis();
      setInitialBalanceStub = testBed.sandbox.stub(AccountCreateTransaction.prototype, 'setInitialBalance').returnsThis();
      executeAccountCreateTransactionStub = testBed.sandbox.stub(AccountCreateTransaction.prototype, 'execute')
        .resolves({ getReceipt: testBed.sandbox.stub().resolves({ accountId }) } as unknown as TransactionResponse);
      setAccountIdStub = testBed.sandbox.stub(AccountInfoQuery.prototype, 'setAccountId').returnsThis();
      executeAccountInfoQueryStub = testBed.sandbox.stub(AccountInfoQuery.prototype, 'execute')
        .resolves({ accountId, balance: new Hbar(balance) } as AccountInfo);
    });

    after(() => {
      setKeyStub.restore();
      setInitialBalanceStub.restore();
      executeAccountCreateTransactionStub.restore();
      setAccountIdStub.restore();
      executeAccountInfoQueryStub.restore();
    });

    it('should create an account', async () => {
      const accountInfo = await AccountUtils.createAccount(publicKey, balance, client);
      testBed.sandbox.assert.match(accountInfo.accountId, accountId);
      testBed.sandbox.assert.match(accountInfo.balance, new Hbar(balance));

      // AccountCreateTransaction
      testBed.sandbox.assert.calledWith(setKeyStub, publicKey);
      testBed.sandbox.assert.calledWith(setInitialBalanceStub, new Hbar(balance));
      testBed.sandbox.assert.calledWith(executeAccountCreateTransactionStub, client);

      // AccountInfoQuery
      testBed.sandbox.assert.calledOnceWithExactly(setAccountIdStub, accountId);
      testBed.sandbox.assert.calledWith(executeAccountInfoQueryStub, client);
    });
  });
});
