import { IService } from './IService';

export class ServiceLocator {
    private services: Map<string,IService> = new Map<string, IService>();

    public static Current: ServiceLocator;

    public static Initiailze(): void {
        this.Current = new ServiceLocator();
    }

    public get<T extends IService>(serviceName: string): T {
        if (!this.services.has(serviceName)) {
          console.error(`${serviceName} not registered with ${this.constructor.name}`);
          throw new Error();
        }
    
        return this.services.get(serviceName) as T;
    }

    public register<T extends IService>(service: T): void {
        const key: string = service.constructor.name;
        if (this.services.has(key)) {
            console.error(`${key} not registered with ${this.constructor.name}`);
            throw new Error();
        }

        this.services.set(key, service);
    }

    public unregister(serviceName: string): void {
        if (!this.services.has(serviceName)) {
            console.error(`Attempted to unregister service of type ${serviceName} which is not registered with ${this.constructor.name}.`);
            return;
        }

        this.services.delete(serviceName);
    }
}
