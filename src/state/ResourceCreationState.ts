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

import { TokenId, TokenType } from '@hashgraph/sdk';
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
import { LOADING, RESOURCE_CREATION_STATE_INIT_MESSAGE } from '../constants';

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
        this.logger.trace(RESOURCE_CREATION_STATE_INIT_MESSAGE, this.stateName);
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
        const { async, createInitialResources } = this.cliService.getCurrentArgv();
        if (!createInitialResources) {
          this.observer!.update(EventType.Finish);
          return;
        }
        
        const mode = async ? 'asynchronous' : 'synchronous';
        this.logger.info(
          `${LOADING} Starting Resource Creation state in ${mode} mode...`, this.stateName);

        const promise = this.createResources();
        if (!async) {
            await promise;
        }
        this.observer!.update(EventType.Finish);
    }

    /**
     * Creates accounts and tokens with the given properties and associates them.
     * @returns Promise that resolves when all resources are created.
     */
    private async createResources(): Promise<void> {
        const accountProps: IAccountProps[] = accounts as IAccountProps[];
        const tokenProps: ITokenProps[] = tokens as ITokenProps[];
        const tokenIds: Map<string, TokenId> = await this.createTokens(tokenProps);
        await this.createAndAssociateAccounts(accountProps, tokenIds);
        await this.mintTokens(tokenProps, tokenIds);
    }

    /**
     * Creates accounts with the given properties.
     * @param accountProps The properties of the accounts to create.
     * @param tokenIdsBySymbol Map of token symbols to token IDs.
     * @returns Promise that resolves when all accounts are created (and associated with tokens).
     */
    private async createAndAssociateAccounts(accountProps: IAccountProps[],
                                             tokenIdsBySymbol: Map<string, TokenId>): Promise<void> {
        this.logger.info('Creating accounts', this.stateName);
        const client = this.clientService.getClient();

        const promises = accountProps.map(async (account: IAccountProps): Promise<void> => {
          const { privateKey, accountInfo } = await AccountUtils.createAccountFromProps(account, client);
          this.logger.info(
            `Successfully created account with:
              * normal account ID: ${accountInfo.accountId.toString()}
              * aliased account ID: ${accountInfo.aliasKey ? `0.0.${  accountInfo.aliasKey?.toString()}` : 'N/A'}
              * private key (use this in SDK/Hedera-native wallets): ${privateKey.toStringDer()}
              * raw private key (use this for JSON RPC wallet import): ${privateKey.toStringRaw()}`,
            this.stateName);

          if (account.associatedTokens && account.associatedTokens.length > 0) {
            const associatedTokenIds = this.getTokenIdsFor(account.associatedTokens, tokenIdsBySymbol);
            await TokenUtils.associateAccountWithTokens(accountInfo.accountId, associatedTokenIds, privateKey, client);
            this.logger.info(
              `Associated account ${accountInfo.accountId} with tokens: ${associatedTokenIds.join(', ')}`,
              this.stateName
            );
          }
        });

        await Promise.all(promises);
    }

    /**
     * Creates tokens with the given properties.
     * @param tokenProps The properties of the tokens to create.
     * @returns Promise that resolves with a map of token symbols to token IDs.
     */
    private async createTokens(tokenProps: ITokenProps[]): Promise<Map<string, TokenId>> {
        this.logger.info('Creating tokens', this.stateName);
        const client = this.clientService.getClient();

        const promises = tokenProps.map(async (token: ITokenProps): Promise<[string, TokenId]> => {
          const tokenId = await TokenUtils.createToken(token, client);
          this.logger.info(
            `Successfully created ${token.tokenType} token '${token.tokenSymbol}' with ID ${tokenId}`,
            this.stateName
          );
          return [token.tokenSymbol, tokenId];
        });

        return new Map<string, TokenId>(await Promise.all(promises));
    }

    /**
     * Gets the token IDs associated with the given token symbols.
     * @param tokenSymbols The token symbols to get IDs for.
     * @param tokenIdsBySymbol Map of token symbols to token IDs.
     * @returns The token IDs associated with the account.
     */
    private getTokenIdsFor(tokenSymbols: string[],
                           tokenIdsBySymbol: Map<string, TokenId>): TokenId[] {
        return tokenSymbols?.filter(tokenSymbol => {
          if (!tokenIdsBySymbol.has(tokenSymbol)) {
            this.logger.warn(`Token ID for ${tokenSymbol} not found`, this.stateName);
            return false;
          }
          return true;
        }).map(tokenSymbol => tokenIdsBySymbol.get(tokenSymbol)!) || [];
    }

  /**
   * Mints tokens with the given properties.
   * @param tokenProps The properties of the tokens to mint.
   * @param tokenIdsBySymbol Map of token symbols to token IDs.
   */
    private async mintTokens(tokenProps: ITokenProps[],
                             tokenIdsBySymbol: Map<string, TokenId>): Promise<void> {
        this.logger.info('Minting NFTs', this.stateName);
        const client = this.clientService.getClient();

        const promises = tokenProps
          .filter(token => {
            const isNft = token.tokenType === TokenType.NonFungibleUnique.toString();
            const shouldMint = isNft && !!token.mints?.length;
            if (shouldMint && !tokenIdsBySymbol.has(token.tokenSymbol)) {
              this.logger.warn(`Token ID for ${token.tokenSymbol} not found`, this.stateName);
              return false;
            }
            return shouldMint;
          })
          .map(async (token: ITokenProps): Promise<void> => {
            const tokenId = tokenIdsBySymbol.get(token.tokenSymbol)!;
            const supplyKey = TokenUtils.getSupplyKey(token);
            await Promise.all(token.mints!.map(async ({ CID }) => {
              await TokenUtils.mintToken(tokenId, CID, supplyKey, client);
              this.logger.info(
                `Minted token ID ${tokenId} with CID '${CID}'`,
                this.stateName
              );
            }));
          });

        await Promise.all(promises);
    }
}
