import { IState } from "../state/IState";

export interface SelectedStateConfiguration {
    stateMachineName: String;
    states: Array<IState>;
}
