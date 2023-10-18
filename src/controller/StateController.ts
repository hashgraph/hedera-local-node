import { StateData } from '../data/StateData';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';

export class StateController {
    private logger: LoggerService;

    private currStateNum: number;

    private maxStateNum: number;

    constructor(stateName: string) {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.currStateNum = 0;
        this.maxStateNum = 0;
        this.logger.trace('State Controller Initialized!');
        this.logger.info(`Starting ${stateName} procedure!`);
    }

    public async startStateMachine() {
        this.logger.info('starting something');
        const startConfig = new StateData().getSelectedStateConfiguration('start1');
        if (!startConfig) {
            process.exit(1);
            // TODO: do something about this.
        }

        this.maxStateNum = startConfig.states.length;
        startConfig.states[this.currStateNum].onStart();
    }

    public update(event: EventType): void {
        if (event === EventType.Finish) {
            // TODO: do something on finish
        } else {
            // TODO: do something on error
        }
    }

    private transition(): void {
        if (!(this.currStateNum < this.maxStateNum)) {
            // TODO: end program
            process.exit(0);
        }
        this.currStateNum+=1;
        
    }
}

// use observer pattern so that states can send events and don't have any connection to this controller