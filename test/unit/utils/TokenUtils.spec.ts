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

import { SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';
import { ClientService } from '../../../src/services/ClientService';
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
import { getPrivateKey, IPrivateKey, KeyType } from '../../../src/configuration/types/IPrivateKey';
import { expect } from 'chai';
import NonFungibleUnique = TokenType.NonFungibleUnique;
import Finite = TokenSupplyType.Finite;

describe(TokenUtils.name, () => {
  const client = Client.forLocalNode().setOperator(
    AccountId.fromString('0.0.2'),
    PrivateKey.fromStringED25519('302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137')
  );
  let testBed: LocalNodeTestBed;
  let clientServiceStub: SinonStubbedInstance<ClientService>;
  let getClientStub: SinonStub<[], Client>;

  before(() => {
    testBed = getTestBed();
    clientServiceStub = testBed.clientServiceStub;
    getClientStub = clientServiceStub.getClient.returns(client);
  });

  after(() => {
    getClientStub.restore();
    testBed.sandbox.restore();
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

    before(() => {
      setAccountIdStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'setAccountId').returnsThis();
      setTokenIdsStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'setTokenIds').returnsThis();
      freezeWithStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'freezeWith').returnsThis()
      signStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'sign').resolvesThis();
      executeStub = testBed.sandbox.stub(TokenAssociateTransaction.prototype, 'execute')
        .resolves({ getReceipt: testBed.sandbox.stub().resolves() } as unknown as TransactionResponse);
    });

    after(() => {
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

    before(() => {
      setTokenIdStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'setTokenId').returnsThis();
      setMetadataStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'setMetadata').returnsThis();
      freezeWithStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'freezeWith').returnsThis();
      signStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'sign').resolvesThis();
      executeStub = testBed.sandbox.stub(TokenMintTransaction.prototype, 'execute')
        .resolves({ getReceipt: testBed.sandbox.stub().resolves() } as unknown as TransactionResponse);
    });

    after(() => {
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
      tokenType: 'FungibleCommon',
      supplyType: 'Infinite',
      tokenMemo: 'Test Token Memo',
      decimals: 0,
      initialSupply: 100,
      maxSupply: 1000,
      treasuryKey: toIPrivateKey(PrivateKey.generateECDSA()),
      kycKey: toIPrivateKey(PrivateKey.generateECDSA()),
      freezeKey: toIPrivateKey(PrivateKey.generateECDSA()),
      wipeKey: toIPrivateKey(PrivateKey.generateECDSA()),
      supplyKey: toIPrivateKey(PrivateKey.generateECDSA()),
      feeScheduleKey: toIPrivateKey(PrivateKey.generateECDSA()),
      freezeDefault: false,
      autoRenewAccountId: '0.0.12345',
      expirationTime: '2022-01-01T00:00:00.000Z',
      autoRenewPeriod: 100,
      customFees: []
    };

    const tokenWithED25519Keys: ITokenProps = {
      tokenName: 'Test NFT Token',
      tokenSymbol: 'TNFT',
      tokenType: 'NonFungibleUnique',
      supplyType: 'Finite',
      treasuryKey: toIPrivateKey(PrivateKey.generateED25519()),
      kycKey: toIPrivateKey(PrivateKey.generateED25519()),
      freezeKey: toIPrivateKey(PrivateKey.generateED25519()),
      wipeKey: toIPrivateKey(PrivateKey.generateED25519()),
      supplyKey: toIPrivateKey(PrivateKey.generateED25519()),
      feeScheduleKey: toIPrivateKey(PrivateKey.generateED25519())
    };

    const tokenWithoutKeys: ITokenProps = {
      tokenName: 'Test Fungible Token No Keys',
      tokenSymbol: 'TFTNK',
      tokenType: 'FungibleCommon',
      supplyType: 'Finite'
    };

    for (const token of [tokenWithEcdsaKeys, tokenWithED25519Keys, tokenWithoutKeys]) {
      const keyType = token.treasuryKey?.type;
      let freezeWithStub: SinonStub<[client: any | null], TokenCreateTransaction>;
      let signStub: SinonStub<[privateKey: PrivateKey], Promise<TokenCreateTransaction>>;
      let signWithOperatorStub: SinonStub<[client: any], Promise<TokenCreateTransaction>>;
      let executeStub: SinonStub<[client: any, requestTimeout?: number | undefined], Promise<TransactionResponse>>;
      let getTokenCreateTransactionSpy: SinonSpy;

      describe(`when token has ${keyType} keys`, () => {
        beforeEach(() => {
          freezeWithStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'freezeWith').returnsThis();
          signStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'sign').resolvesThis();
          signWithOperatorStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'signWithOperator').resolvesThis();
          executeStub = testBed.sandbox.stub(TokenCreateTransaction.prototype, 'execute').resolves({
            getReceipt: testBed.sandbox.stub().resolves({ tokenId: TokenId.fromString('0.0.12345') })
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

        if (keyType !== undefined) {
          describe(`when token has admin key`, () => {
            before(() => {
              if (keyType === KeyType.ED25519) {
                token.adminKey = toIPrivateKey(PrivateKey.generateED25519());
              }
              if (keyType === KeyType.ECDSA) {
                token.adminKey = toIPrivateKey(PrivateKey.generateECDSA());
              }
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
          before(() => {
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
      const expectedTokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(token.tokenName)
        .setTokenSymbol(token.tokenSymbol)
        .setTokenType(token.tokenType === NonFungibleUnique.toString() ? TokenType.NonFungibleUnique : TokenType.FungibleCommon)
        .setSupplyType(token.supplyType === Finite.toString() ? TokenSupplyType.Finite : TokenSupplyType.Infinite);
      if (token.decimals !== undefined) {
        expectedTokenCreateTransaction.setDecimals(token.decimals);
      }
      if (token.tokenType === TokenType.NonFungibleUnique.toString()) {
        expectedTokenCreateTransaction.setInitialSupply(0);
      } else {
        expectedTokenCreateTransaction.setInitialSupply(token.initialSupply || 0);
      }
      if (token.maxSupply !== undefined) {
        expectedTokenCreateTransaction.setMaxSupply(token.maxSupply);
      }
      if (token.treasuryKey !== undefined) {
        expectedTokenCreateTransaction.setTreasuryAccountId(
          getPrivateKey(token.treasuryKey!).publicKey.toAccountId(0, 0));
      } else {
        expectedTokenCreateTransaction.setTreasuryAccountId(
          AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!));
      }
      if (token.kycKey !== undefined) {
        expectedTokenCreateTransaction.setKycKey(getPrivateKey(token.kycKey!));
      }
      if (token.freezeKey !== undefined) {
        expectedTokenCreateTransaction.setFreezeKey(getPrivateKey(token.freezeKey!));
      }
      if (token.wipeKey !== undefined) {
        expectedTokenCreateTransaction.setWipeKey(getPrivateKey(token.wipeKey!));
      }
      if (token.supplyKey !== undefined) {
        expectedTokenCreateTransaction.setSupplyKey(getPrivateKey(token.supplyKey!));
      } else {
        expectedTokenCreateTransaction.setSupplyKey(
          PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!));
      }
      if (token.feeScheduleKey !== undefined) {
        expectedTokenCreateTransaction.setFeeScheduleKey(getPrivateKey(token.feeScheduleKey!));
      }
      if (token.freezeDefault !== undefined) {
        expectedTokenCreateTransaction.setFreezeDefault(token.freezeDefault);
      }
      if (token.autoRenewAccountId !== undefined) {
        expectedTokenCreateTransaction.setAutoRenewAccountId(AccountId.fromString(token.autoRenewAccountId));
      }
      if (token.expirationTime !== undefined) {
        expectedTokenCreateTransaction.setExpirationTime(new Date(token.expirationTime));
      }
      if (token.autoRenewPeriod !== undefined) {
        expectedTokenCreateTransaction.setAutoRenewPeriod(token.autoRenewPeriod);
      }
      if (token.tokenMemo !== undefined) {
        expectedTokenCreateTransaction.setTokenMemo(token.tokenMemo);
      }
      return expectedTokenCreateTransaction;
    }
  });

  describe('getSupplyKey', () => {
    it('should return the supply key when it is provided', () => {
      const supplyKey: PrivateKey = PrivateKey.generateECDSA();
      const token: ITokenProps = {
        tokenName: 'Test Fungible Token',
        tokenSymbol: 'TFT',
        tokenType: 'FungibleCommon',
        supplyType: 'Infinite',
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
        tokenType: 'FungibleCommon',
        supplyType: 'Infinite'
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
        tokenType: 'FungibleCommon',
        supplyType: 'Infinite',
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
        tokenType: 'FungibleCommon',
        supplyType: 'Infinite'
      };

      const actualTreasuryAccountId: AccountId = TokenUtils.getTreasuryAccountId(token);
      testBed.sandbox.assert.match(actualTreasuryAccountId, operatorId);
    });
  });

  function toIPrivateKey(key: PrivateKey): IPrivateKey {
    let keyType: KeyType;
    switch(key.type) {
      case 'ED25519':
        keyType = KeyType.ED25519;
        break;
      case 'secp256k1':
        keyType = KeyType.ECDSA;
        break;
      case 'DER':
        keyType = KeyType.DER;
        break;
      default:
        throw new Error(`Unsupported key type: ${key.type}`);
    }
    return { value: key.toString(), type: keyType };
  }
});
