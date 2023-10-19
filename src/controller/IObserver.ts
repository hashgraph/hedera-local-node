import { EventType } from '../types/EventType';

export interface IOBserver {
    update(event: EventType): void
}