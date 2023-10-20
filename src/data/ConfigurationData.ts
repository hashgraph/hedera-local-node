import { NetworkConfiguration } from '../types/NetworkConfiguration';
import { NetworkType } from '../types/NetworkType';
import local from '../configuration/local.json';
import mainnet from '../configuration/mainnet.json'
import testnet from '../configuration/testnet.json'
import previewnet from '../configuration/previewnet.json'
export class ConfigurationData {
    public getSelectedConfigurationData(network: NetworkType) {
        switch (network) {
            case NetworkType.LOCAL:
                return this.getNetworkConfiguration(local as any);
            case NetworkType.MAINNET:
                return this.getNetworkConfiguration(mainnet as any);
            case NetworkType.TESTNET:
                return this.getNetworkConfiguration(testnet as any);
            case NetworkType.PREVIEWNET:
                return this.getNetworkConfiguration(previewnet as any);
            default:
                return this.getNetworkConfiguration(local as any);
        }
    }

    private getNetworkConfiguration(jsonConfiguration: NetworkConfiguration) {
        const relayConfiguration = jsonConfiguration?.envConfiguration || undefined;
        const nodeProperties = jsonConfiguration?.nodeConfiguration || undefined;
        const nodeSettings = jsonConfiguration?.nodeSettings || undefined;
        const configuration: NetworkConfiguration = {
            imageTagConfiguration: { 
                consensusNodeImageTag: jsonConfiguration.imageTagConfiguration.consensusNodeImageTag,
                mirrorImageTag: jsonConfiguration.imageTagConfiguration.mirrorImageTag,
                mirrorNodeExplorerImageTag: jsonConfiguration.imageTagConfiguration.mirrorNodeExplorerImageTag,
                relayImageTag: jsonConfiguration.imageTagConfiguration.relayImageTag
            },
            envConfiguration: relayConfiguration,
            nodeConfiguration: nodeProperties,
            nodeSettings: nodeSettings
        }

        return configuration
    }
}