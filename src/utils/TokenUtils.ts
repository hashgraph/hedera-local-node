/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import {
  AccountId,
  Client,
  CustomFee,
  PrivateKey,
  TokenAssociateTransaction,
  TokenCreateTransaction,
  TokenId,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TransactionReceipt
} from '@hashgraph/sdk';
import { ITokenProps } from '../configuration/types/ITokenProps';
import { getPrivateKey } from '../configuration/types/IPrivateKey';

/**
 * Provides utility methods for working with tokens.
 */
export class TokenUtils {

  /**
   * Associates an account with the given tokens.
   * @param accountId The account ID to associate.
   * @param tokenIds The token IDs to associate.
   * @param accountKey The account key to sign the transaction.
   * @param client The client to use for associating the account with tokens.
   * @returns {Promise<void>}
   * A promise that resolves when the account is associated with the tokens.
   */
  public static async associateAccountWithTokens(accountId: AccountId,
                                                 tokenIds: TokenId[],
                                                 accountKey: PrivateKey,
                                                 client: Client): Promise<void> {
    const signTx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds(tokenIds)
      .freezeWith(client)
      .sign(accountKey);

    const txResponse = await signTx.execute(client);
    await txResponse.getReceipt(client);
  }

  /**
   * Mints the given amount of tokens for the given token.
   * @param tokenId The token ID to mint.
   * @param CID The CID metadata for the minted tokens.
   * @param supplyKey The supply key to sign the transaction.
   * @param client The client to use for minting the tokens.
   * @returns {TransactionReceipt} The receipt of the mint transaction.
   */
  public static async mintToken(tokenId: TokenId,
                                CID: string,
                                supplyKey: PrivateKey,
                                client: Client): Promise<TransactionReceipt> {
    const transaction = new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(CID)])
      .freezeWith(client);

    const signTx = await transaction.sign(supplyKey);
    const txResponse = await signTx.execute(client);
    return txResponse.getReceipt(client);
  }

  /**
   * Creates a token with the given properties.
   * @param token The properties of the token to create.
   * @param client The client to use for creating the token.
   * @returns {TokenId} The ID of the created token.
   */
  public static async createToken(token: ITokenProps, client: Client): Promise<TokenId> {
    const transaction = this.getTokenCreateTransaction(token);

    let signTx: TokenCreateTransaction = transaction.freezeWith(client);
    if (token.adminKey) {
      signTx = await signTx.sign(getPrivateKey(token.adminKey));
    }
    signTx = await signTx.signWithOperator(client);

    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return receipt.tokenId!;
  }

  /**
   * Returns the supply key for the given token.
   *
   * NOTE: The operator key will be used as a supply key by default,
   * if the supply key is not provided in the properties
   *
   * @param token The properties of the token.
   * @returns {PrivateKey} The supply key for the token.
   */
  public static getSupplyKey(token: ITokenProps): PrivateKey {
    // The operator key will be used as supply key if one is not provided
    if (token.supplyKey) {
      return getPrivateKey(token.supplyKey);
    }
    return PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!);
  }

  /**
   * Returns the treasury account ID for the given token.
   *
   * NOTE: The operator ID will be used as a treasury account ID by default,
   * if the treasury key is not provided in the properties
   *
   * @param token The properties of the token.
   * @returns {AccountId} The treasury account ID for the token.
   */
  public static getTreasuryAccountId(token: ITokenProps): AccountId {
    // The operator key will be used as treasury key if one is not provided
    if (token.treasuryKey) {
      return getPrivateKey(token.treasuryKey).publicKey.toAccountId(0, 0);
    }
    return AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!);
  }

  /**
   * Creates a token create transaction with the given properties.
   * @param token The properties of the token to create.
   * @returns {TokenCreateTransaction} The token create transaction.
   */
  private static getTokenCreateTransaction(token: ITokenProps): TokenCreateTransaction {
    this.validateTokenProperties(token);
    const transaction = new TokenCreateTransaction();
    this.setRequiredProperties(transaction, token);
    this.setKeyProperties(transaction, token);
    this.setOptionalProperties(transaction, token);
    return transaction;
  }

  /**
   * Sets the required properties of the token create transaction.
   * @param transaction The transaction to set the properties on.
   * @param token The properties of the token to create.
   */
  private static setRequiredProperties(transaction: TokenCreateTransaction, token: ITokenProps): void {
    transaction.setTokenName(token.tokenName);
    transaction.setTokenSymbol(token.tokenSymbol);
    transaction.setTreasuryAccountId(this.getTreasuryAccountId(token));
    transaction.setSupplyKey(this.getSupplyKey(token));
    // If not provided, the TokenType is FUNGIBLE_COMMON by default
    if (token.tokenType === TokenType.NonFungibleUnique.toString()) {
      transaction.setTokenType(TokenType.NonFungibleUnique);
      transaction.setInitialSupply(0);
    } else {
      transaction.setTokenType(TokenType.FungibleCommon);
      if (token.initialSupply) {
        transaction.setInitialSupply(token.initialSupply);
      }
      if (token.decimals) {
        transaction.setDecimals(token.decimals);
      }
    }
    // If not provided, the TokenSupplyType is INFINITE by default
    if (token.supplyType === TokenSupplyType.Finite.toString()) {
      transaction.setSupplyType(TokenSupplyType.Finite);
      if (token.maxSupply) {
        transaction.setMaxSupply(token.maxSupply);
      }
    } else {
      transaction.setSupplyType(TokenSupplyType.Infinite);
    }
  }

  /**
   * Sets the key properties of the token create transaction.
   * @param transaction The transaction to set the properties on.
   * @param token The properties of the token to create.
   */
  private static setKeyProperties(transaction: TokenCreateTransaction, token: ITokenProps): void {
    if (token.adminKey) {
      transaction.setAdminKey(getPrivateKey(token.adminKey));
    }
    if (token.kycKey) {
      transaction.setKycKey(getPrivateKey(token.kycKey));
    }
    if (token.freezeKey) {
      transaction.setFreezeKey(getPrivateKey(token.freezeKey));
    }
    if (token.pauseKey) {
      transaction.setPauseKey(getPrivateKey(token.pauseKey));
    }
    if (token.wipeKey) {
      transaction.setWipeKey(getPrivateKey(token.wipeKey));
    }
    if (token.feeScheduleKey) {
      transaction.setFeeScheduleKey(getPrivateKey(token.feeScheduleKey));
    }
  }

  /**
   * Sets the optional properties of the token create transaction.
   * @param transaction The transaction to set the properties on.
   * @param token The properties of the token to create.
   */
  private static setOptionalProperties(transaction: TokenCreateTransaction, token: ITokenProps): void {
    if (token.freezeDefault !== undefined) {
      transaction.setFreezeDefault(token.freezeDefault);
    }
    if (token.autoRenewAccountId) {
      transaction.setAutoRenewAccountId(token.autoRenewAccountId);
    }
    if (token.expirationTime) {
      transaction.setExpirationTime(new Date(token.expirationTime));
    }
    if (token.autoRenewPeriod) {
      transaction.setAutoRenewPeriod(token.autoRenewPeriod);
    }
    if (token.tokenMemo) {
      transaction.setTokenMemo(token.tokenMemo);
    }
    if (token.customFees) {
      // TODO: Test this
      transaction.setCustomFees(token.customFees.map(CustomFee._fromProtobuf));
    }
  }

  private static validateTokenProperties(token: ITokenProps): void {
    this.assertTruthy(token.tokenName, 'Token name is required');
    this.assertTruthy(token.tokenSymbol, 'Token symbol is required');
    this.assertTruthy(token.tokenType, 'Token type is required');
    this.assertTruthy(token.supplyType, 'Supply type is required');
    // If the token type is NON_FUNGIBLE_UNIQUE,
    // the initial supply must be 0 and decimals must be undefined
    if (token.tokenType === TokenType.NonFungibleUnique.toString()) {
      this.assertFalsy(token.initialSupply, 'Initial supply must be 0 or undefined for non-fungible tokens');
      this.assertFalsy(token.decimals, 'Decimals must be 0 or undefined for non-fungible tokens');
    } else {
      this.assertTruthy(token.initialSupply, 'Initial supply is required for fungible tokens');
      this.assertTruthy(token.decimals, 'Decimals is required for fungible tokens');
    }
    // If the token supply type is FINITE, the max supply must be provided
    if (token.supplyType === TokenSupplyType.Finite.toString()) {
      this.assertTruthy(token.maxSupply, 'Max supply is required for finite supply tokens');
    } else {
      this.assertFalsy(token.maxSupply, `Max supply must be undefined for infinite supply tokens, was ${token.maxSupply}`);
    }
    if (token.autoRenewPeriod) {
      this.assertTruthy(token.autoRenewAccountId, 'Auto renew account ID is required for auto renew period');
      this.assertInRange(token.autoRenewPeriod, 2_592_000, 8_000_000, 'Auto renew period must be between 30 days and 3 months');
    }
  }

  private static assertTruthy(condition: unknown, errorMessage: string): void {
    if (!condition) {
      throw new Error(errorMessage);
    }
  }

  private static assertFalsy(condition: unknown, errorMessage: string): void {
    if (condition) {
      throw new Error(errorMessage);
    }
  }

  private static assertInRange(value: number, min: number, max: number, errorMessage: string): void {
    if (value < min || value > max) {
      throw new Error(errorMessage);
    }
  }
}
