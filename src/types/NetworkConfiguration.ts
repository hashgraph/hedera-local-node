export interface NetworkConfiguration {
    imageTagConfiguration: ImageTagConfiguration,
    envConfiguration?: Array<Configuration>,
    nodeConfiguration?: NodeConfiguration,
}

export interface NodeConfiguration {
    properties: Array<Configuration>,
    settings: Array<Configuration>
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
