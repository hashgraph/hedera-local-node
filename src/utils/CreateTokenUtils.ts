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
  TokenCreateTransaction,
  TokenId,
  TokenSupplyType,
  TokenType
} from '@hashgraph/sdk';
import { ITokenProps } from '../configuration/types/ITokenProps';

export class CreateTokenUtils {

  /**
   * Creates a token with the given properties.
   * @param props The properties of the token to create.
   * @param client The client to use for creating the token.
   */
  public static async createToken(props: ITokenProps, client: Client): Promise<[string, TokenId]> {
    const transaction = this.getTokenCreateTransaction(props);

    let signTx;
    if (props.adminKey) {
      const adminKey = PrivateKey.fromStringECDSA(props.adminKey);
      transaction.setAdminKey(adminKey.publicKey);
      transaction.freezeWith(client);
      signTx = await (await transaction.sign(adminKey)).signWithOperator(client);
    } else {
      transaction.freezeWith(client);
      signTx = await transaction.signWithOperator(client);
    }

    const txResponse = await signTx.execute(client);
    const receipt = await txResponse.getReceipt(client);

    return [props.tokenSymbol, receipt.tokenId!];
  }

  private static getTokenCreateTransaction(props: ITokenProps): TokenCreateTransaction {
    const transaction = new TokenCreateTransaction();
    this.setRequiredProperties(transaction, props);
    this.setKeyProperties(transaction, props);
    this.setOptionalProperties(transaction, props);
    return transaction;
  }

  private static setRequiredProperties(transaction: TokenCreateTransaction, props: ITokenProps): void {
    transaction.setTokenName(props.tokenName);
    transaction.setTokenSymbol(props.tokenSymbol);
    // If not provided, the TokenType is FUNGIBLE_COMMON by default
    if (props.tokenType === TokenType.NonFungibleUnique.toString()) {
      transaction.setTokenType(TokenType.NonFungibleUnique);
      transaction.setInitialSupply(0);
    } else {
      transaction.setTokenType(TokenType.FungibleCommon);
      transaction.setInitialSupply(props.initialSupply);
    }
    // If not provided, the TokenSupplyType is INFINITE by default
    if (props.supplyType === TokenSupplyType.Finite.toString()) {
      transaction.setSupplyType(TokenSupplyType.Finite);
    } else {
      transaction.setSupplyType(TokenSupplyType.Infinite);
    }
  }

  private static setKeyProperties(transaction: TokenCreateTransaction, props: ITokenProps): void {
    const operatorKey = PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!);
    const operatorId = AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!);

    // The operator will be used as treasury account if one is not provided
    if (props.treasuryKey) {
      const treasuryKey = PrivateKey.fromStringECDSA(props.treasuryKey);
      transaction.setTreasuryAccountId(treasuryKey.publicKey.toAccountId(0, 0));
    } else {
      transaction.setTreasuryAccountId(operatorId);
    }

    // The operator key will be used as supply key if one is not provided
    if (props.supplyKey) {
      transaction.setSupplyKey(PrivateKey.fromStringECDSA(props.supplyKey));
    } else {
      transaction.setSupplyKey(operatorKey.publicKey);
    }

    if (props.kycKey) {
      transaction.setKycKey(PrivateKey.fromStringECDSA(props.kycKey));
    }

    if (props.freezeKey) {
      transaction.setFreezeKey(PrivateKey.fromStringECDSA(props.freezeKey));
    }

    if (props.pauseKey) {
      transaction.setPauseKey(PrivateKey.fromStringECDSA(props.pauseKey));
    }

    if (props.wipeKey) {
      transaction.setWipeKey(PrivateKey.fromStringECDSA(props.wipeKey));
    }

    if (props.feeScheduleKey) {
      transaction.setFeeScheduleKey(PrivateKey.fromStringECDSA(props.feeScheduleKey));
    }
  }

  private static setOptionalProperties(transaction: TokenCreateTransaction, props: ITokenProps): void {
    if (props.maxSupply) {
      transaction.setMaxSupply(props.maxSupply);
    }
    if (props.decimals) {
      transaction.setDecimals(props.decimals);
    }
    if (props.freezeDefault) {
      transaction.setFreezeDefault(props.freezeDefault);
    }
    if (props.autoRenewAccountId) {
      transaction.setAutoRenewAccountId(props.autoRenewAccountId);
    }
    if (props.expirationTime) {
      transaction.setExpirationTime(new Date(props.expirationTime));
    }
    if (props.autoRenewPeriod) {
      transaction.setAutoRenewPeriod(props.autoRenewPeriod);
    }
    if (props.tokenMemo) {
      transaction.setTokenMemo(props.tokenMemo);
    }
    if (props.customFees) {
      // TODO: Test this
      transaction.setCustomFees(props.customFees.map(CustomFee._fromProtobuf));
    }
  }
}