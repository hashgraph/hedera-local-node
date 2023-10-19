import { AccountCreationState } from '../state/AccountCreationState';
import { ConfigurationState } from '../state/ConfigurationState';
import { InitState } from '../state/InitState';
import { NetworkPrepState } from '../state/NetworkPrepState';
import { StartState } from '../state/StartState';
import { StopState } from '../state/StopState';
import { SelectedStateConfiguration } from '../types/SelectedStateConfiguration';

export class StateData {

    public getSelectedStateConfiguration(stateName: string): SelectedStateConfiguration | undefined {
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
        
    private getRestartConfiguration(): SelectedStateConfiguration {
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

    private getStartConfiguration(): SelectedStateConfiguration {
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

    private getStopConfiguration(): SelectedStateConfiguration {
        return {
            'stateMachineName' : 'stop',
            'states' : [
                new InitState(),
                new StopState()
            ]
        };
    }
}