import { homedir } from 'os';
import { dirname, join } from 'path';
import  { existsSync, mkdirSync, lstatSync, copyFileSync, readdirSync } from 'fs';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';

export class FileSystemUtils{

    public static copyPaths(directories: { [source: string]: string }): void {
        Object.entries(directories).forEach(([srcDir, destDir]) => {
            FileSystemUtils.copyPath(srcDir, destDir);
        });
    }
    
    public static copyPath(srcPath: string, destPath: string): void {
        if (!existsSync(srcPath)) return;
    
        if (lstatSync(srcPath).isDirectory()) {
            FileSystemUtils.copyDirectoryContents(srcPath, destPath);
        } else {
            FileSystemUtils.copyFile(srcPath, destPath);
        }
    }
    
    public static copyDirectoryContents(srcDir: string, destDir: string): void {
        FileSystemUtils.ensureDirectoryExists(destDir);
        const entries = readdirSync(srcDir, { withFileTypes: true });
    
        entries.forEach(entry => {
            const srcPath = join(srcDir, entry.name);
            const destPath = join(destDir, entry.name);
    
            if (entry.isDirectory()) {
                FileSystemUtils.copyPaths({ [srcPath]: destPath });
            } else {
                FileSystemUtils.copyFile(srcPath, destPath);
            }
        });
    }
    
    public static copyFile(srcPath: string, destPath: string): void {
        const logger=ServiceLocator.Current.get<LoggerService>(LoggerService.name);

        FileSystemUtils.ensureDirectoryExists(dirname(destPath));
        copyFileSync(srcPath, destPath);
        logger.trace(`Copied file: ${destPath}`, FileSystemUtils.name);
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
}