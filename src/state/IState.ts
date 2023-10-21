import { IOBserver } from '../controller/IObserver';

export interface IState {
    onStart(): void;
    subscribe(observer: IOBserver): void;
}
