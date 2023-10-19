export interface NetworkConfiguration {
    consensusNodeImageTag: string,
    mirrorImageTag: string,
    relayImageTag: string,
    mirrorNodeExplorerImageTag: string,
    transactionMaxBytes: string,
    maxResults: string,
    defaultLimit: string,
    mirrorNodeRetries: string,
    mirrorNodeRetryDelay: string,
    tier1Limit: string,
    tier2Limit: string,
    tier3Limit: string,
    limitDuration: string,
    hbarLimit: string,
    hbarLimitDuration: string,
    blockRangeLimit: string,
    wsConnectionLimitPerIp: number,
    wsConnectionLimit: number,
    wsConnectionTTL: number,
    wsMultipleAddressesEnabled: boolean,
    wsSubscriptionsLimit: number,
    features?: Array<Features>
}

export interface Features {
    featureKey: string,
    featureValue: any
}
