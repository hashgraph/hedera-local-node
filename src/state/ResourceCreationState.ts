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

import { AccountId, PrivateKey, TokenId } from '@hashgraph/sdk';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { ClientService } from '../services/ClientService';
import { accounts, tokens } from '../configuration/initialResources.json';
import { EventType } from '../types/EventType';
import { TokenUtils } from '../utils/TokenUtils';
import { ITokenProps } from '../configuration/types/ITokenProps';
import { IAccountProps } from '../configuration/types/IAccountProps';
import { AccountUtils } from '../utils/AccountUtils';

/**
 * Represents the state of resource creation.
 * This class is responsible for initializing the ResourceCreationState object.
 *
 * Uses {@link accounts} and {@link tokens} from the initialResources.json
 * to create initial resources for the local-node environment
 * 
 * @implements {IState}
 */
export class ResourceCreationState implements IState {
    /**
     * The name of the state.
     */
    private readonly stateName: string;

    /**
     * The logger used for logging resource creation state information.
     */
    private readonly logger: LoggerService;

    /**
     * The CLI service used for resource creation.
     */
    private readonly cliService: CLIService;

    /**
     * The client service used for resource creation.
     */
    private readonly clientService: ClientService;

    /**
     * The observer for the resource creation state.
     */
    private observer: IOBserver | undefined;

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
     * @returns Promise that resolves when the state is started.
     * @emits {EventType.Finish} When the state is finished.
     */
    public async onStart(): Promise<void> {
        const { async } = this.cliService.getCurrentArgv();
        
        const mode = async ? 'asynchronous' : 'synchronous';
        this.logger.info(
          `Starting Resource Creation State in ${mode} mode`, this.stateName);

        const promise = this.createResources()
          .then(() => this.observer!.update(EventType.Finish));
        if (!async) {
            await promise;
        }
    }

    /**
     * Creates accounts and tokens with the given properties and associates them.
     * @returns Promise that resolves when all resources are created.
     */
    private async createResources(): Promise<void> {
        const accountProps: IAccountProps[] = accounts as unknown as IAccountProps[];
        const tokenProps: ITokenProps[] = tokens as unknown as ITokenProps[];

        const accountIds: Map<string, AccountId> = await this.createAccounts(accountProps);
        const tokenIds: Map<string, TokenId> = await this.createTokens(tokenProps);
        await this.associateAccountsWithTokens(accountProps, accountIds, tokenIds);
    }

    /**
     * Creates accounts with the given properties.
     * @param accountProps The properties of the accounts to create.
     * @returns Promise that resolves with a map of account private keys to account IDs.
     */
    private async createAccounts(accountProps: IAccountProps[]): Promise<Map<string, AccountId>> {
        this.logger.info('Creating accounts', this.stateName);
        const client = this.clientService.getClient();
        const accountIds = await Promise.all(
          accountProps.map(async (account: IAccountProps): Promise<[string, AccountId]> => {
              const [privateKeyAliasECDSA, info] = await AccountUtils.createAccount(account, client);
              const privateKey = PrivateKey.fromStringECDSA(privateKeyAliasECDSA);
              this.logger.info(
                `Successfully created account with:
                * normal account ID: ${info.accountId.toString()}
                * aliased account ID: 0.0.${info.aliasKey?.toString()}
                * private key (use this in SDK/Hedera-native wallets): ${privateKey.toStringDer()}
                * raw private key (use this for JSON RPC wallet import): ${privateKey.toStringRaw()}`,
                this.stateName);
              return [privateKeyAliasECDSA, info.accountId];
          })
        );
        return new Map<string, AccountId>(accountIds);
    }

    /**
     * Creates tokens with the given properties.
     * @param tokenProps The properties of the tokens to create.
     * @returns Promise that resolves with a map of token symbols to token IDs.
     */
    private async createTokens(tokenProps: ITokenProps[]): Promise<Map<string, TokenId>> {
        this.logger.info('Creating tokens', this.stateName);
        const client = this.clientService.getClient();
        const tokenIds = await Promise.all(
          tokenProps.map(async (token: ITokenProps): Promise<[string, TokenId]> => {
              const [tokenSymbol, tokenId] = await TokenUtils.createToken(token, client);
              this.logger.info(
                `Successfully created ${token.tokenType} token '${tokenSymbol}' with ID ${tokenId}`,
                this.stateName
              );
              return [tokenSymbol, tokenId];
          })
        );
        return new Map<string, TokenId>(tokenIds);
    }

    /**
     * Associates accounts with tokens.
     * @param accountProps The properties of the accounts to associate.
     * @param accountIds Map of account private keys to account IDs.
     * @param tokenIds Map of token symbols to token IDs.
     * @returns Promise that resolves when all accounts are associated with tokens.
     */
    private async associateAccountsWithTokens(accountProps: IAccountProps[],
                                              accountIds: Map<string, AccountId>,
                                              tokenIds: Map<string, TokenId>): Promise<void> {
        this.logger.info('Associating accounts with tokens', this.stateName);

        const client = this.clientService.getClient();
        const associateAccountPromises: Promise<void>[] = accountProps
          .filter(account => {
              if (!accountIds.has(account.privateKeyAliasECDSA)) {
                  this.logger.warn(`Account ID for key ${account.privateKeyAliasECDSA} not found`, this.stateName);
                  return false;
              }
              return true;
          })
          .map(async (account: IAccountProps): Promise<void> => {
              const accountId = accountIds.get(account.privateKeyAliasECDSA)!;
              const accountTokens = this.getAssociatedTokenIds(account, tokenIds);
              const privateKey = PrivateKey.fromStringECDSA(account.privateKeyAliasECDSA);
              await TokenUtils.associateAccountWithTokens(accountId, accountTokens, privateKey, client);
              this.logger.info(
                `Associated account ${accountId} with token IDs: ${accountTokens.join(', ')}`,
                this.stateName
              );
          });

        await Promise.all(associateAccountPromises);
    }

    /**
     * Gets the token IDs associated with the given account.
     * @param account The account to get the associated token IDs for.
     * @param tokenIdsBySymbol Map of token symbols to token IDs.
     * @returns The token IDs associated with the account.
     */
    private getAssociatedTokenIds(account: IAccountProps,
                                  tokenIdsBySymbol: Map<string, TokenId>): TokenId[] {
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
}
