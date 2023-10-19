import { IOBserver } from "../controller/IObserver";

export interface IState {
    onStart(): void;
    onError(): void;
    onFinish(): void;
    subscribe(observer: IOBserver): void;
}
