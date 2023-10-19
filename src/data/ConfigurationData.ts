import { NetworkType } from "../types/NetworkType";

export class ConfigurationData {
    public getSelectedConfigurationData(network: NetworkType) {
        switch (network) {
            case NetworkType.LOCAL:
                return this.getLocalNetworkConfiguration();
            case NetworkType.MAINNET:
                return this.getMainnetNetworkConfiguration();
            case NetworkType.TESTNET:
                return this.getTestnetNetworkConfiguration();
            case NetworkType.PREVIEWNET:
                return this.getPreviewnetNetworkConfiguration();
            default:
                return this.getLocalNetworkConfiguration();
        }
    }

    public getLocalNetworkConfiguration() {

    }

    public getMainnetNetworkConfiguration() {

    }

    public getTestnetNetworkConfiguration() {

    }

    public getPreviewnetNetworkConfiguration() {

    }
}