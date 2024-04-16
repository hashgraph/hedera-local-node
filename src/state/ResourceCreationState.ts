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
    AccountInfoQuery,
    CustomFee,
    Hbar,
    Long,
    PrivateKey,
    TokenAssociateTransaction,
    TokenCreateTransaction,
    TokenId,
    TokenSupplyType,
    TokenType,
    TransferTransaction
} from '@hashgraph/sdk';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { ClientService } from '../services/ClientService';
import { accounts, tokens } from '../configuration/initialResources.json';
import { EventType } from '../types/EventType';

export interface AccountProps {
    privateKeyAliasECDSA: string;
    balance: number;
    associatedTokens: string[];
}

export interface TokenProps {
    tokenName: string;
    tokenSymbol: string;
    tokenType: string;
    supplyType: string;
    decimals: number | Long;
    treasuryPrivateKeyECDSA: string;
    initialSupply?: number | Long;
    maxSupply?: number | Long;
    adminPrivateKeyECDSA?: string;
    kycKey?: string;
    freezeKey?: string;
    pauseKey?: string;
    wipeKey?: string;
    supplyKey?: string;
    feeScheduleKey?: string;
    freezeDefault?: boolean;
    autoRenewAccountId?: string;
    expirationTime?: string;
    autoRenewPeriod?: number | Long;
    tokenMemo?: string;
    customFees?: CustomFee[];
}

/**
 * Represents the state of resource creation.
 * This class is responsible for initializing the ResourceCreationState object.
 * @implements {IState}
 */
export class ResourceCreationState implements IState {
    /**
     * The logger used for logging resource creation state information.
     */
    private logger: LoggerService;

    /**
     * The CLI service used for resource creation.
     */
    private cliService: CLIService;

    /**
     * The client service used for resource creation.
     */
    private clientService: ClientService;

    /**
     * The observer for the resource creation state.
     */
    private observer: IOBserver | undefined;

    /**
     * The name of the state.
     */
    private readonly stateName: string;

    /**
     * Represents the state of resource creation.
     * This class is responsible for initializing the ResourceCreationState object.
     */
    constructor() {
        this.stateName = ResourceCreationState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliService = ServiceLocator.Current.get<CLIService>(CLIService.name);
        this.clientService = ServiceLocator.Current.get<ClientService>(ClientService.name);
        this.logger.trace('Resource Creation State Initialized!', this.stateName);
    }

    /**
     * Subscribes an observer to receive updates from the ResourceCreationState.
     * @param {IOBserver} observer The observer to subscribe.
     */
    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    /**
     * This method is responsible for starting the ResourceCreationState.
     * It creates tokens asynchronously or synchronously based on the CLI arguments.
     * @returns {Promise<void>} A Promise that resolves when the state is started.
     * @emits {EventType.Finish} When the state is finished.
     */
    public async onStart(): Promise<void> {
        const { async } = this.cliService.getCurrentArgv();
        
        const mode = async ? 'asynchronous' : 'synchronous';
        this.logger.info(
          `Starting resource Creation state in ${mode} mode`, this.stateName);

        const promise = this.createResources()
          .then(() => this.observer!.update(EventType.Finish));
        if (!async) {
            await promise;
        }
    }

    private async createResources(): Promise<void> {
        const accountProps = accounts as unknown as AccountProps[];
        const accountIds = await this.createAccounts(accountProps);


        const tokenIds = await this.createTokens(tokens as unknown as TokenProps[]);
        await this.associateAccountsWithTokens(accountProps, accountIds, tokenIds);
    }

    private async createAccounts(accountProps: AccountProps[]): Promise<Map<string, AccountId>> {
        this.logger.info('Creating accounts', this.stateName);
        const accountIds = await Promise.all(
          accountProps.map(props => this.createAccount(props))
        );
        return new Map(accountIds);
    }

    private async createTokens(tokenProps: TokenProps[]): Promise<Map<string, TokenId>> {
        this.logger.info('Creating tokens', this.stateName);
        const tokenIds = await Promise.all(
          tokenProps.map((props: TokenProps) => this.createToken(props))
        );
        return new Map(tokenIds);
    }

    private async associateAccountsWithTokens(
      accountProps: AccountProps[],
      accountIds: Map<string, AccountId>,
      tokenIds: Map<string, TokenId>
    ): Promise<void> {
        this.logger.info('Associating accounts with tokens', this.stateName);

        const promises: Promise<void>[] = accountProps
          .filter(account => {
              if (!accountIds.has(account.privateKeyAliasECDSA)) {
                  this.logger.warn(`Account ID for key ${account.privateKeyAliasECDSA} not found`, this.stateName);
                  return false;
              }
              return true;
          })
          .map(account => {
              const accountId = accountIds.get(account.privateKeyAliasECDSA)!;
              const accountKey = PrivateKey.fromStringECDSA(account.privateKeyAliasECDSA);
              const accountTokens = this.getAssociatedTokenIds(account, tokenIds);
              return this.associateAccountWithTokens(accountId, accountKey, accountTokens);
          });

        await Promise.all(promises);
    }

    private getAssociatedTokenIds(account: AccountProps, tokenIdsBySymbol: Map<string, TokenId>): TokenId[] {
        return account.associatedTokens
          .filter(tokenSymbol => {
              if (!tokenIdsBySymbol.has(tokenSymbol)) {
                  this.logger.warn(`Token ID for ${tokenSymbol} not found`, this.stateName);
                  return false;
              }
              return true;
          })
          .map(tokenSymbol => tokenIdsBySymbol.get(tokenSymbol)!);
    }

    private async createAccount(props: AccountProps): Promise<[string, AccountId]> {
        const privateKey = PrivateKey.fromStringECDSA(props.privateKeyAliasECDSA);
        const aliasAccountId = privateKey.publicKey.toAccountId(0, 0);
        const hbarAmount = new Hbar(props.balance);

        const client = this.clientService.getClient();
        const response = await new TransferTransaction()
          .addHbarTransfer(client.operatorAccountId!, hbarAmount.negated())
          .addHbarTransfer(aliasAccountId, hbarAmount)
          .execute(client);
        await response.getReceipt(client);

        const info = await new AccountInfoQuery()
          .setAccountId(aliasAccountId)
          .execute(client);
        this.logger.info(
          `
          The normal account ID: ${info.accountId.toString()}
          The aliased account ID: 0.0.${info.aliasKey?.toString()}
          The private key (use this in SDK/Hedera-native wallets): ${privateKey.toStringDer()}
          The raw private key (use this for JSON RPC wallet import): ${privateKey.toStringRaw()}
          `,
          this.stateName);
        return [props.privateKeyAliasECDSA, info.accountId];
    }

    private async associateAccountWithTokens(accountId: AccountId,
                                             accountKey: PrivateKey,
                                             tokenIds: TokenId[]): Promise<void> {
        const client = this.clientService.getClient();

        const signTx = await new TokenAssociateTransaction()
          .setAccountId(accountId)
          .setTokenIds(tokenIds)
          .freezeWith(client)
          .sign(accountKey);

        const txResponse = await signTx.execute(client);
        await txResponse.getReceipt(client);

        this.logger.info(
          `Associated account ${accountId} with token IDs: ${tokenIds.join(', ')}`,
          this.stateName
        );
    }

    private async createToken(props: TokenProps): Promise<[string, TokenId]> {
        const operatorKey = PrivateKey.fromStringED25519(process.env.RELAY_OPERATOR_KEY_MAIN!);
        const operatorId = AccountId.fromString(process.env.RELAY_OPERATOR_ID_MAIN!);

        const transaction = new TokenCreateTransaction()
          .setTokenName(props.tokenName)
          .setTokenSymbol(props.tokenSymbol);

        // All keys will default to the operator key if not provided
        if (props.treasuryPrivateKeyECDSA) {
            const treasuryKey = PrivateKey.fromStringECDSA(props.treasuryPrivateKeyECDSA);
            transaction.setTreasuryAccountId(treasuryKey.publicKey.toAccountId(0, 0));
        } else {
            transaction.setTreasuryAccountId(operatorId);
        }

        if (props.supplyKey) {
            transaction.setSupplyKey(PrivateKey.fromStringECDSA(props.supplyKey));
        } else {
            transaction.setSupplyKey(operatorKey.publicKey);
        }

        if (props.kycKey) {
            transaction.setKycKey(PrivateKey.fromStringECDSA(props.kycKey));
        } else {
            transaction.setKycKey(operatorKey.publicKey);
        }

        if (props.freezeKey) {
            transaction.setFreezeKey(PrivateKey.fromStringECDSA(props.freezeKey));
        } else {
            transaction.setFreezeKey(operatorKey.publicKey);
        }

        if (props.pauseKey) {
            transaction.setPauseKey(PrivateKey.fromStringECDSA(props.pauseKey));
        } else {
            transaction.setPauseKey(operatorKey.publicKey);
        }

        if (props.wipeKey) {
            transaction.setWipeKey(PrivateKey.fromStringECDSA(props.wipeKey));
        } else {
            transaction.setWipeKey(operatorKey.publicKey);
        }

        if (props.feeScheduleKey) {
            transaction.setFeeScheduleKey(PrivateKey.fromStringECDSA(props.feeScheduleKey));
        } else {
            transaction.setFeeScheduleKey(operatorKey.publicKey);
        }

        // Set initial supply to 0 for NFTs
        if (props.tokenType === TokenType.NonFungibleUnique.toString()) {
            transaction.setTokenType(TokenType.NonFungibleUnique);
            transaction.setInitialSupply(0);
        } else {
            transaction.setTokenType(TokenType.FungibleCommon);
            transaction.setInitialSupply(props.initialSupply);
        }

        if (props.supplyType === TokenSupplyType.Finite.toString()) {
            transaction.setSupplyType(TokenSupplyType.Finite);
        } else {
            transaction.setSupplyType(TokenSupplyType.Infinite);
        }

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
            transaction.setCustomFees(props.customFees);
        }

        const client = this.clientService.getClient();

        let signTx: TokenCreateTransaction = transaction;
        if (props.adminPrivateKeyECDSA) {
            const adminKey = PrivateKey.fromStringECDSA(props.adminPrivateKeyECDSA);
            signTx.setAdminKey(adminKey.publicKey);
            signTx.freezeWith(client);
            signTx = await (await signTx.sign(adminKey)).signWithOperator(client);
        } else {
            signTx.freezeWith(client);
            signTx = await signTx.signWithOperator(client);
        }

        const txResponse = await signTx.execute(client);
        const receipt = await txResponse.getReceipt(client);
        this.logger.info(
          `Successfully created ${props.tokenType} token '${props.tokenSymbol}' with ID ${receipt.tokenId}`,
          this.stateName
        );
        return [props.tokenSymbol, receipt.tokenId!];
    }
}
