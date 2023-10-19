import { StateData } from '../data/StateData';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { SelectedStateConfiguration } from '../types/SelectedStateConfiguration';

export class StateController {
    private logger: LoggerService;

    private stateConfiguration: SelectedStateConfiguration | undefined;

    private currStateNum: number;

    private maxStateNum: number;

    constructor(stateName: string) {
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.stateConfiguration = new StateData().getSelectedStateConfiguration(stateName);
        this.currStateNum = 0;
        this.maxStateNum = 0;
        this.logger.trace('State Controller Initialized!');
        this.logger.info(`Starting ${stateName} procedure!`);
    }

    public async startStateMachine() {
        if (!this.stateConfiguration) {
            this.logger.error('Something is wrong with state configuration!');
            process.exit(1);
            // TODO: do something about this.
        }

        this.maxStateNum = this.stateConfiguration.states.length;
        this.stateConfiguration.states[this.currStateNum].onStart();
    }

    public update(event: EventType): void {
        if (event === EventType.Finish) {
            this.transitionToNextState();
            // TODO: do something on finish
        } else {
            // TODO: do something on error
        }
    }

    private transitionToNextState(): void {
        if (!(this.currStateNum < this.maxStateNum)) {
            // TODO: end program
            process.exit(0);
        }
        this.currStateNum+=1;
        this.stateConfiguration!.states[this.currStateNum].onStart();
    }
}

// use observer pattern so that states can send events and don't have any connection to this controller