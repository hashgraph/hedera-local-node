export interface NetworkConfiguration {
    imageTagConfiguration: ImageTagConfiguration,
    envConfiguration?: Array<Configuration>,
    nodeConfiguration?: Array<Configuration>,
    nodeSettings?: Array<Configuration>
}

export interface ImageTagConfiguration {
    consensusNodeImageTag: string,
    mirrorImageTag: string,
    relayImageTag: string,
    mirrorNodeExplorerImageTag: string
}

export interface Configuration {
    key: string,
    value: any
}
