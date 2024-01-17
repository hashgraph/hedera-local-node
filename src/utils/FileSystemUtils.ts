import { homedir } from 'os';
import { join, resolve } from 'path';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';

export class FileSystemUtils{
    public static copyPaths(directories: { [source: string]: string }): void {
        const logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);

        Object.entries(directories).forEach(([srcPath, destPath]) => {
            if (!existsSync(srcPath)) {
                logger.error(`Path ${srcPath} doesn't exist`, FileSystemUtils.name);
                return;
            }

            try {
                cpSync(srcPath, destPath, { recursive: true });
            } catch (error: any) {
                logger.error(error.message);
            }
        });
    }
        
    public static ensureDirectoryExists(dirPath: string): void {
        const logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        
        if (!existsSync(dirPath)) {
            mkdirSync(dirPath, { recursive: true });
            logger.trace(`Directory created: ${dirPath}`,FileSystemUtils.name);
        } else {
            logger.trace(`Directory already exists: ${dirPath}`,FileSystemUtils.name);
        }
    }

    public static getPlatformSpecificAppDataPath(name: string) {
        if (process.platform === 'darwin') {
            return join(homedir(), 'Library', 'Application Support', name);
        }
    
        if (process.platform === 'win32') {
            return join(process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local'), name);
        }
        // else it's Linux
        return join(process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share'), name);
    }

    public static createEphemeralDirectories(workDir: string) {
        const directories = [
            workDir,
            join(workDir, 'network-logs', 'node', 'accountBalances', 'balance0.0.3'),
            join(workDir, 'network-logs', 'node', 'recordStreams', 'record0.0.3', 'sidecar'),
            join(workDir, 'network-logs', 'node', 'logs'),
            join(workDir, 'network-logs', 'node', 'stats'),
        ];
        
        directories.forEach(dir => FileSystemUtils.ensureDirectoryExists(dir)); // creating those directories ensures we'll have permissions to delete them on cleanup
    }

    public static parseWorkDir(workdir: string): string {
        let workdirPath = workdir;
        if (workdirPath.startsWith('~')) {
            workdirPath = join(homedir(), workdirPath.slice(1));
        }
        if (workdirPath !== this.getPlatformSpecificAppDataPath('hedera-local')) {
            workdirPath = join(workdirPath, 'hedera-local');
        }
        return resolve(workdirPath);
    }
}
