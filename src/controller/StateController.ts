import { StateData } from '../data/StateData';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { EventType } from '../types/EventType';
import { StateConfiguration } from '../types/StateConfiguration';
import { IOBserver } from './IObserver';

export class StateController implements IOBserver{
    private logger: LoggerService;

    private stateConfiguration: StateConfiguration | undefined;

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
            // TODO: handle error
            process.exit(1);
        }

        this.maxStateNum = this.stateConfiguration.states.length;
        this.stateConfiguration!.states[this.currStateNum].subscribe(this);
        this.stateConfiguration.states[this.currStateNum].onStart();
    }

    public update(event: EventType): void {
        if (event === EventType.Finish) {
            this.transitionToNextState();
        } else {
            // TODO: handle error
        }
    }

    private transitionToNextState(): void {
        if (!(this.currStateNum < this.maxStateNum)) {
            // TODO: handle end of program
            process.exit(0);
        }
        this.currStateNum+=1;

        try {
            this.stateConfiguration!.states[this.currStateNum].subscribe(this);
            this.stateConfiguration!.states[this.currStateNum].onStart();
        } catch (error) {
            if (error instanceof TypeError) {
                // Ignore this error, it finds the methods and executes the code, but still results in TypeError
            } else {
                this.logger.error(`Trying to transition to next state was not possible. Error is: ${error}`);
            }
        }
    }
}
