import { IState } from "../state/IState";

export interface StateConfiguration {
    stateMachineName: String;
    states: Array<IState>;
}
