import { configDotenv } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { CLIOptions } from '../types/CLIOptions';
import { IOBserver } from '../controller/IObserver';
import { EventType } from '../types/EventType';
import { ConfigurationData } from '../data/ConfigurationData';
import { Configuration } from '../types/NetworkConfiguration';
import originalNodeConfiguration from '../configuration/originalNodeConfiguration.json';

configDotenv({ path: path.resolve(__dirname, '../../.env') });

export class InitState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    private cliOptions: CLIOptions;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.cliOptions = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
        this.logger.trace('Initialization State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public onStart(): void {
        this.logger.trace('Initialization State Starting...');
        console.log(this.cliOptions.network)
        const configurationData = new ConfigurationData().getSelectedConfigurationData(this.cliOptions.network);
        this.logger.info(`Setting configuration for ${this.cliOptions.network} network with latest images on host ${this.cliOptions.host} with dev mode turned ${this.cliOptions.devMode ? 'on' : 'off'} using ${this.cliOptions.fullMode? 'full': 'turbo'} mode in ${this.cliOptions.multiNode? 'multi' : 'single'} node configuration...`);

        this.configureEnvVariables(configurationData.envConfiguration);
        this.configureNodeProperties(configurationData.nodeConfiguration?.properties);

        this.observer!.update(EventType.Finish);
    }

    private configureEnvVariables(envConfiguration: Array<Configuration> | undefined): void {
        if (!envConfiguration) {
            this.logger.trace('No new environment variables were configured.');
            return;
        }

        envConfiguration!.forEach(variable => {
            process.env[variable.key] = variable.value;
            this.logger.trace(`Environment variable ${variable.key} will be set to ${variable.value}.`);
        });
        this.logger.info('Needed environment variables were set for this configuration.');
    }

    private configureNodeProperties(nodeConfiguration: Array<Configuration> | undefined): void {
        const propertiesFilePath = join(__dirname, '../../compose-network/network-node/data/config/bootstrap.properties');
        const file = readFileSync(propertiesFilePath, 'utf-8');
        let newProperties: string = "";
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
        });

        if (!nodeConfiguration) {
            this.logger.trace('No additional node configuration needed.');
            return;
        }
        console.log(nodeConfiguration)
        nodeConfiguration!.forEach(property => {
            newProperties = newProperties.concat(`${property.key}=${property.value}\n`);
            this.logger.trace(`Bootstrap property ${property.key} will be set to ${property.value}.`);
        });

        writeFileSync(propertiesFilePath, newProperties, {flag: 'w'});

        this.logger.info('Needed bootsrap properties were set for this configuration.');
    }

    onError(): void {
        // log last things and call onError event
        throw new Error('Method not implemented.');
    }

    onFinish(): void {
        // log last things and call onFinish event
        throw new Error('Method not implemented.');
    }
}
// this state loads all configurations and files