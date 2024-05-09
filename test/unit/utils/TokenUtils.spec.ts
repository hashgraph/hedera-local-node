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

import { SinonSpy, SinonStub } from 'sinon';
import { before } from 'mocha';
import { getTestBed, LocalNodeTestBed } from '../testBed';
import { TokenUtils } from '../../../src/utils/TokenUtils';
import {
  AccountId,
  Client,
  PrivateKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenId,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TransactionResponse
} from '@hashgraph/sdk';
import { ITokenProps } from '../../../src/configuration/types/ITokenProps';
import { getPrivateKey, KeyType } from '../../../src/configuration/types/IPrivateKey';
import { expect } from 'chai';
import { toIPrivateKey } from '../../testUtils';
import NonFungibleUnique = TokenType.NonFungibleUnique;
import Finite = TokenSupplyType.Finite;
import FungibleCommon = TokenType.FungibleCommon;
import Infinite = TokenSupplyType.Infinite;

describe(TokenUtils.name, () => {
  let testBed: LocalNodeTestBed;
  let client: Client;

  before(() => {
    testBed = getTestBed();
    client = testBed.clientServiceStub.getClient();
  });

  after(() => {
    testBed.sandbox.resetHistory();
  });

  describe('associateAccountWithTokens', () => {
    const accountKey: PrivateKey = PrivateKey.generateECDSA();
    const accountId: AccountId = AccountId.fromString('0.0.12345');
    const tokenIds: TokenId[] = [TokenId.fromString('0.0.54321')];

    let setAccountIdStub: SinonStub<[accountId: string | AccountId], TokenAssociateTransaction>;
    let setTokenIdsStub: SinonStub<[tokenIds: (string | TokenId)[]], TokenAssociateTransaction>;
    let freezeWithStub: SinonStub<[client: any | null], TokenAssociateTransaction>;
    let signStub: SinonStub<[privateKey: PrivateKey], Promise<TokenAssociateTransaction>>;
    let executeStub: SinonStub<[client: any, requestTimeout?: number | undefined], Promise<TransactionResponse>>;

    beforeEach(() => {
      setAccountIdStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'setAccountId').returnsThis();
      setTokenIdsStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'setTokenIds').returnsThis();
      freezeWithStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'freezeWith').returnsThis()
      signStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'sign').resolvesThis();
      executeStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'execute').resolves({
        getReceipt: testBed.sandbox.stub().resolves()
      } as unknown as TransactionResponse);
    });

    afterEach(() => {
      setAccountIdStub.restore();
      setTokenIdsStub.restore();
      freezeWithStub.restore();
      signStub.restore();
      executeStub.restore();
    });

    it('should associate the account with the given tokens', async () => {
      await TokenUtils.associateAccountWithTokens(accountId, tokenIds, accountKey, client);

      testBed.sandbox.assert.calledOnceWithExactly(setAccountIdStub, accountId);
      testBed.sandbox.assert.calledOnceWithExactly(setTokenIdsStub, tokenIds);
      testBed.sandbox.assert.calledOnceWithExactly(freezeWithStub, client);
      testBed.sandbox.assert.calledOnceWithExactly(signStub, accountKey);
      testBed.sandbox.assert.calledOnceWithExactly(executeStub, client);
    });
  });

  describe('mintToken', () => {
    const supplyKey: PrivateKey = PrivateKey.generateECDSA();
    const tokenId: TokenId = TokenId.fromString('0.0.12345');
    const CID: string = '0x123';

    let setTokenIdStub: SinonStub<[tokenId: string | TokenId], TokenMintTransaction>;
    let setMetadataStub: SinonStub<[metadata: Uint8Array[]], TokenMintTransaction>;
    let freezeWithStub: SinonStub<[client: any | null], TokenMintTransaction>;
    let signStub: SinonStub<[privateKey: PrivateKey], Promise<TokenMintTransaction>>;
    let executeStub: SinonStub<[client: any, requestTimeout?: number | undefined], Promise<TransactionResponse>>;

    beforeEach(() => {
      setTokenIdStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'setTokenId').returnsThis();
      setMetadataStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'setMetadata').returnsThis();
      freezeWithStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'freezeWith').returnsThis();
      signStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'sign').resolvesThis();
      executeStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'execute').resolves({
        getReceipt: testBed.sandbox.stub().resolves()
      } as unknown as TransactionResponse);
    });

    afterEach(() => {
      setTokenIdStub.restore();
      setMetadataStub.restore();
      freezeWithStub.restore();
      signStub.restore();
      executeStub.restore();
    });

    it('should mint the given amount of tokens for the given token', async () => {
      await TokenUtils.mintToken(tokenId, CID, supplyKey, client);

      testBed.sandbox.assert.calledOnceWithExactly(setTokenIdStub, tokenId);
      testBed.sandbox.assert.calledOnceWithExactly(setMetadataStub, [Buffer.from(CID)]);
      testBed.sandbox.assert.calledOnceWithExactly(freezeWithStub, client);
      testBed.sandbox.assert.calledOnceWithExactly(signStub, supplyKey);
      testBed.sandbox.assert.calledOnceWithExactly(executeStub, client);
    });
  });

  describe('createToken', () => {
    const tokenWithEcdsaKeys: ITokenProps = {
      tokenName: 'Test Fungible Token',
      tokenSymbol: 'TFT',
      tokenType: FungibleCommon.toString(),
      supplyType: Infinite.toString(),
      tokenMemo: 'Test Token Memo',
      decimals: 2,
      initialSupply: 100,
      treasuryKey: toIPrivateKey(PrivateKey.generateECDSA()),
      kycKey: toIPrivateKey(PrivateKey.generateECDSA()),
      freezeKey: toIPrivateKey(PrivateKey.generateECDSA()),
      pauseKey: toIPrivateKey(PrivateKey.generateECDSA()),
      wipeKey: toIPrivateKey(PrivateKey.generateECDSA()),
      supplyKey: toIPrivateKey(PrivateKey.generateECDSA()),
      feeScheduleKey: toIPrivateKey(PrivateKey.generateECDSA()),
      freezeDefault: false,
      autoRenewAccountId: '0.0.12345',
      expirationTime: '2022-01-01T00:00:00.000Z',
      autoRenewPeriod: 2_592_000,
      customFees: []
    };

    const tokenWithED25519Keys: ITokenProps = {
      tokenName: 'Test NFT Token',
      tokenSymbol: 'TNFT',
      tokenType: NonFungibleUnique.toString(),
      supplyType: Finite.toString(),
      maxSupply: 1000,
      treasuryKey: toIPrivateKey(PrivateKey.generateED25519()),
      kycKey: toIPrivateKey(PrivateKey.generateED25519()),
      freezeKey: toIPrivateKey(PrivateKey.generateED25519()),
      pauseKey: toIPrivateKey(PrivateKey.generateED25519()),
      wipeKey: toIPrivateKey(PrivateKey.generateED25519()),
      supplyKey: toIPrivateKey(PrivateKey.generateED25519()),
      feeScheduleKey: toIPrivateKey(PrivateKey.generateED25519()),
      freezeDefault: true,
      autoRenewAccountId: '0.0.12345',
      expirationTime: '2022-01-01T00:00:00.000Z',
      autoRenewPeriod: 8_000_000,
      customFees: []
    };

    const tokenWithoutKeys: ITokenProps = {
      tokenName: 'Test Fungible Token No Keys',
      tokenSymbol: 'TFTNK',
      tokenType: FungibleCommon.toString(),
      supplyType: Finite.toString(),
      decimals: 2,
      initialSupply: 1_000_000,
      maxSupply: 1_000_000_000
    };

    for (const token of [tokenWithEcdsaKeys, tokenWithED25519Keys, tokenWithoutKeys]) {
      const keyType = token.treasuryKey?.type;

      describe(`when token has ${keyType} keys`, () => {
        let freezeWithStub: SinonStub<[client: any | null], TokenCreateTransaction>;
        let signStub: SinonStub<[privateKey: PrivateKey], Promise<TokenCreateTransaction>>;
        let signWithOperatorStub: SinonStub<[client: any], Promise<TokenCreateTransaction>>;
        let executeStub: SinonStub<[client: any, requestTimeout?: number | undefined], Promise<TransactionResponse>>;
        let getTokenCreateTransactionSpy: SinonSpy;

        beforeEach(() => {
          freezeWithStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'freezeWith').returnsThis();
          signStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'sign').resolvesThis();
          signWithOperatorStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'signWithOperator').resolvesThis();
          executeStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'execute').resolves({
            getReceipt: testBed.sandbox.stub().resolves({
              tokenId: TokenId.fromString('0.0.12345')
            })
          } as unknown as TransactionResponse);
          getTokenCreateTransactionSpy = testBed.sandbox.spy(TokenUtils, <keyof TokenUtils>'getTokenCreateTransaction');
        });

        afterEach(() => {
          freezeWithStub.restore();
          signStub.restore();
          signWithOperatorStub.restore();
          executeStub.restore();
          getTokenCreateTransactionSpy.restore();
        });

        it('should fill TokenCreateTransaction with the correct properties', async () => {
          const tokenId = await TokenUtils.createToken(token, client);
          expect(tokenId).to.be.instanceOf(TokenId);
          expect(tokenId.toString()).to.equal('0.0.12345');

          testBed.sandbox.assert.calledOnceWithExactly(getTokenCreateTransactionSpy, token);
          testBed.sandbox.assert.calledOnceWithExactly(freezeWithStub, client);
          testBed.sandbox.assert.calledOnceWithExactly(signWithOperatorStub, client);
          testBed.sandbox.assert.calledOnceWithExactly(executeStub, client);

          const actualTokenCreateTransaction: TokenCreateTransaction = getTokenCreateTransactionSpy.returnValues[0];
          const expectedTokenCreateTransaction: TokenCreateTransaction = getExpectedTokenCreateTransaction(token);
          testBed.sandbox.assert.match(actualTokenCreateTransaction, expectedTokenCreateTransaction);
        });

        if (keyType) {
          describe(`when token has admin key`, () => {
            beforeEach(() => {
              token.adminKey = toIPrivateKey(keyType === KeyType.ED25519 ?
                PrivateKey.generateED25519() :
                PrivateKey.generateECDSA());
            });

            it('should sign token with the admin key and operator client', async () => {
              const tokenId = await TokenUtils.createToken(token, client);

              testBed.sandbox.assert.calledOnceWithExactly(freezeWithStub, client);
              testBed.sandbox.assert.calledOnceWithExactly(signStub, getPrivateKey(token.adminKey!));
              testBed.sandbox.assert.calledOnceWithExactly(signWithOperatorStub, client);
              testBed.sandbox.assert.calledOnceWithExactly(executeStub, client);

              expect(tokenId).to.be.instanceOf(TokenId);
              expect(tokenId.toString()).to.equal('0.0.12345');
            });
          });
        }

        describe('when token does not have admin key', () => {
          beforeEach(() => {
            delete token.adminKey;
          });

          it('should sign token only with operator client', async () => {
            const tokenId = await TokenUtils.createToken(token, client);
            expect(tokenId).to.be.instanceOf(TokenId);
            expect(tokenId.toString()).to.equal('0.0.12345');

            testBed.sandbox.assert.calledOnceWithExactly(freezeWithStub, client);
            testBed.sandbox.assert.notCalled(signStub);
            testBed.sandbox.assert.calledOnceWithExactly(signWithOperatorStub, client);
            testBed.sandbox.assert.calledOnceWithExactly(executeStub, client);
          });
        });
      });
    }

    function getExpectedTokenCreateTransaction(token: ITokenProps): TokenCreateTransaction {
      const transaction = new TokenCreateTransaction()
        .setTokenName(token.tokenName)
        .setTokenSymbol(token.tokenSymbol)
        .setTokenType(token.tokenType === NonFungibleUnique.toString() ? TokenType.NonFungibleUnique : TokenType.FungibleCommon)
        .setSupplyType(token.supplyType === Finite.toString() ? TokenSupplyType.Finite : TokenSupplyType.Infinite);

      // Non-fungible tokens must have an initial supply of 0
      if (token.tokenType === TokenType.NonFungibleUnique.toString()) {
        transaction.setInitialSupply(0);
      } else {
        if (token.initialSupply) {
          transaction.setInitialSupply(token.initialSupply);
        }
        if (token.decimals) {
          transaction.setDecimals(token.decimals);
        }
      }

      if (token.supplyType === TokenSupplyType.Finite.toString() && token.maxSupply) {
        transaction.setMaxSupply(token.maxSupply);
      }

      // Treasury account ID is set to the operator ID by default
      if (token.treasuryKey) {
        transaction.setTreasuryAccountId(
          getPrivateKey(token.treasuryKey!).publicKey.toAccountId(0, 0)
        );
      } else {
        transaction.setTreasuryAccountId(
          AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!)
        );
      }

      // Supply key is set to the operator key by default
      if (token.supplyKey) {
        transaction.setSupplyKey(getPrivateKey(token.supplyKey!));
      } else {
        transaction.setSupplyKey(
          PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!)
        );
      }

      if (token.kycKey) {
        transaction.setKycKey(getPrivateKey(token.kycKey!));
      }

      if (token.freezeKey) {
        transaction.setFreezeKey(getPrivateKey(token.freezeKey!));
      }

      if (token.pauseKey) {
        transaction.setPauseKey(getPrivateKey(token.pauseKey!));
      }

      if (token.wipeKey) {
        transaction.setWipeKey(getPrivateKey(token.wipeKey!));
      }

      if (token.feeScheduleKey) {
        transaction.setFeeScheduleKey(getPrivateKey(token.feeScheduleKey!));
      }

      if (token.freezeDefault !== undefined) {
        transaction.setFreezeDefault(token.freezeDefault);
      }

      if (token.autoRenewAccountId) {
        transaction.setAutoRenewAccountId(AccountId.fromString(token.autoRenewAccountId));
      }

      if (token.expirationTime) {
        transaction.setExpirationTime(new Date(token.expirationTime));
      }

      if (token.autoRenewPeriod >= 2_592_000 && token.autoRenewPeriod <= 8_000_000) {
        transaction.setAutoRenewPeriod(token.autoRenewPeriod);
      }

      if (token.tokenMemo) {
        transaction.setTokenMemo(token.tokenMemo);
      }

      return transaction;
    }
  });

  describe('getSupplyKey', () => {
    it('should return the supply key when it is provided', () => {
      const supplyKey: PrivateKey = PrivateKey.generateECDSA();
      const token: ITokenProps = {
        tokenName: 'Test Fungible Token',
        tokenSymbol: 'TFT',
        tokenType: FungibleCommon.toString(),
        supplyType: Infinite.toString(),
        supplyKey: toIPrivateKey(supplyKey)
      };

      const actualSupplyKey: PrivateKey = TokenUtils.getSupplyKey(token);
      testBed.sandbox.assert.match(actualSupplyKey, supplyKey);
    });

    it('should return the operator key when the supply key is not provided', () => {
      const operatorKey: PrivateKey = PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!);
      const token: ITokenProps = {
        tokenName: 'Test Fungible Token',
        tokenSymbol: 'TFT',
        tokenType: FungibleCommon.toString(),
        supplyType: Infinite.toString()
      };

      const actualSupplyKey: PrivateKey = TokenUtils.getSupplyKey(token);
      testBed.sandbox.assert.match(actualSupplyKey, operatorKey);
    });
  });

  describe('getTreasuryAccountId', () => {
    it('should return the treasury account ID when it is provided', () => {
      const treasuryKey: PrivateKey = PrivateKey.generateECDSA();
      const token: ITokenProps = {
        tokenName: 'Test Fungible Token',
        tokenSymbol: 'TFT',
        tokenType: FungibleCommon.toString(),
        supplyType: Infinite.toString(),
        treasuryKey: toIPrivateKey(treasuryKey)
      };

      const actualTreasuryAccountId: AccountId = TokenUtils.getTreasuryAccountId(token);
      testBed.sandbox.assert.match(actualTreasuryAccountId, treasuryKey.publicKey.toAccountId(0, 0));
    });

    it('should return the operator ID when the treasury key is not provided', () => {
      const operatorId: AccountId = AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!);
      const token: ITokenProps = {
        tokenName: 'Test Fungible Token',
        tokenSymbol: 'TFT',
        tokenType: FungibleCommon.toString(),
        supplyType: Infinite.toString()
      };

      const actualTreasuryAccountId: AccountId = TokenUtils.getTreasuryAccountId(token);
      testBed.sandbox.assert.match(actualTreasuryAccountId, operatorId);
    });
  });
});
