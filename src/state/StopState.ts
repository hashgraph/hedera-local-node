import { writeFileSync } from 'fs';
import { join } from 'path';
import { IOBserver } from '../controller/IObserver';
import originalNodeConfiguration from '../configuration/originalNodeConfiguration.json';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { EventType } from '../types/EventType';

export class StopState implements IState{
    private logger: LoggerService;

    private observer: IOBserver | undefined;

    constructor() {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Stop State Initialized!');
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    onStart(): void {
        this.logger.info('Initiating stop procedure. Trying to clean up volumes and revert files unneeded changes...');
        this.revertNodeProperties();
        // clean volumes
        
        this.observer!.update(EventType.Finish);
    }

    private revertNodeProperties(): void {
        this.logger.trace('Clean up unneeded bootstrap properties.');
        const propertiesFilePath = join(__dirname, '../../compose-network/network-node/data/config/bootstrap.properties');

        let originalProperties = '';
        originalNodeConfiguration.bootsrapProperties.forEach(property => {
            originalProperties = originalProperties.concat(`${property.key}=${property.value}\n`);
        });

        writeFileSync(propertiesFilePath, originalProperties, { flag: 'w' });

        this.logger.info('Clean up finished.');
    }
}
// this state attempts to stop the network and return to original state