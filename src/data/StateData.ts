import { IOBserver } from '../controller/IObserver';
import { AccountCreationState } from '../state/AccountCreationState';
import { ConfigurationState } from '../state/ConfigurationState';
import { InitState } from '../state/InitState';
import { NetworkPrepState } from '../state/NetworkPrepState';
import { StartState } from '../state/StartState';
import { StopState } from '../state/StopState';
import { StateConfiguration } from '../types/StateConfiguration';

export class StateData {

    public getSelectedStateConfiguration(stateName: string): StateConfiguration | undefined {
        switch (stateName) {
            case 'start':
                return this.getStartConfiguration();
            case 'restart':
                return this.getRestartConfiguration();
            case 'stop':
                return this.getStopConfiguration();
            default:
                return undefined;
        }
    }
        
    private getRestartConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'restart',
            'states' : [
                new InitState(),
                new ConfigurationState(),
                new StopState(),
                new StartState(),
                new NetworkPrepState(),
                new AccountCreationState()
            ]
        };
    }

    private getStartConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'start',
            'states' : [
                new InitState(),
                new ConfigurationState(),
                new StartState(),
                new NetworkPrepState(),
                new AccountCreationState()
            ]
        };
    }

    private getStopConfiguration(): StateConfiguration {
        return {
            'stateMachineName' : 'stop',
            'states' : [
                new InitState(),
                new StopState()
            ]
        };
    }
}