import pino, { Logger } from 'pino';
import { IService } from './IService';

export class LoggerService implements IService{

    private logger: Logger;

    constructor() {
        this.logger = pino({
            name: 'hedera-local-node',
            level: process.env.LOG_LEVEL || 'trace',
            transport: {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: true,
                },
              },
          });
        this.logger.info('Logger Service Initialized!');
    }

    public info(msg: string): void {
        this.logger.info(msg);
    }

    public debug(msg: string): void {
        this.logger.debug(msg);
    }

    public trace(msg: string): void {
        this.logger.trace(msg);
    }
}