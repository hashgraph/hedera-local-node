import { InitState } from '../state/InitState';
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
            ]
        };
    }

    private getStartConfiguration(): SelectedStateConfiguration {
        return {
            'stateMachineName' : 'start',
            'states' : [
                new InitState(),
            ]
        };
    }

    private getStopConfiguration(): SelectedStateConfiguration {
        return {
            'stateMachineName' : 'stop',
            'states' : [
                new InitState(),
            ]
        };
    }
}