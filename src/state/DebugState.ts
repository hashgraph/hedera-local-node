/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

import { resolve } from 'path';
import { readdirSync, copyFileSync, unlinkSync } from 'fs';
import shell from 'shelljs';
import { IOBserver } from '../controller/IObserver';
import { LoggerService } from '../services/LoggerService';
import { ServiceLocator } from '../services/ServiceLocator';
import { IState } from './IState';
import { CLIService } from '../services/CLIService';
import { Errors } from '../Errors/LocalNodeErrors';
import { RELATIVE_RECORDS_DIR_PATH, RELATIVE_TMP_DIR_PATH } from '../constants';

export class DebugState implements IState{
    private logger: LoggerService;
    
    private observer: IOBserver | undefined;

    private stateName: string;

    private static readonly recordExt = `.${process.env.STREAM_EXTENSION}`;
    private static readonly sigExt = `.${process.env.STREAM_SIG_EXTENSION}`;
    
    constructor() {
        this.stateName = DebugState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Debug State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
        this.observer = observer;
    }

    public async onStart(): Promise<void> {
        try {
            const { timestamp } = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
            // DebugState.checkForDebugMode();
            this.logger.trace('Debug State Starting...', this.stateName);
            const jsTimestampNum = DebugState.getAndValidateTimestamp(timestamp)

            const tempDir = resolve(__dirname, RELATIVE_TMP_DIR_PATH);
            const recordFilesDirPath = resolve(__dirname, RELATIVE_RECORDS_DIR_PATH);
            this.findAndCopyRecordFileToTmpDir(jsTimestampNum, recordFilesDirPath, tempDir)
            // Perform the parsing
            await shell.exec(
                'docker exec network-node bash /opt/hgcapp/recordParser/parse.sh'
            );
      
            DebugState.cleanTempDir(tempDir);
        } catch (error: any) {
            this.logger.error(error.message);
            return
        }
    }

    private static cleanTempDir(dirPath: string): void {
        for (const tempFile of readdirSync(dirPath)) {
            if (tempFile !== '.gitignore') {
              unlinkSync(resolve(dirPath, tempFile));
            }
        }
    }

    private static getAndValidateTimestamp(timestamp: string): number {
        const timestampRegEx = /^\d{10}[.-]\d{9}$/;
        if (!timestampRegEx.test(timestamp)) {          
          throw Errors.INVALID_TIMESTAMP_ERROR();
        }
    
        // Parse the timestamp to a record file filename
        let jsTimestamp = timestamp
          .replace('.', '')
          .replace('-', '')
          .substring(0, 13);
        return parseInt(jsTimestamp);
    }

    private findAndCopyRecordFileToTmpDir(jsTimestampNum: number, recordFilesDirPath: string, tmpDirPath: string): void {
        // Copy the record file to a temp directory
          const files = readdirSync(recordFilesDirPath);
          
          for (let i = 1; i < files.length; i++) {
            const file = files[i];
            const recordFileName = file.replace(DebugState.recordExt, '');
            const fileTimestamp = new Date(recordFileName.replace(/_/g, ':')).getTime();
            if (fileTimestamp >= jsTimestampNum) {
              const fileToCopy = [
                files[i - 2],
                files[i]
              ];

              this.copyFilesToTmpDir(fileToCopy, tmpDirPath, recordFilesDirPath)
              return
            }
          }
            
          throw Errors.NO_RECORD_FILE_FOUND_ERROR();
    }

    private copyFilesToTmpDir(
      filesToCopy: string | Array<string>,
      tmpDirPath: string,
      recordFilesDirPath: string
    ): void {
        if (Array.isArray(filesToCopy)) {
          for (const file of filesToCopy) {
            this.copyFileToDir(file, recordFilesDirPath, tmpDirPath)
          }
          return
        }

        this.copyFileToDir(filesToCopy, recordFilesDirPath, tmpDirPath)
    }

    private copyFileToDir(
      fileToCopy: string,
      srcPath: string,
      destinationPath: string,
    ): void {
        if (fileToCopy.endsWith(DebugState.recordExt)) {
          this.logger.trace(`Parsing record file [${fileToCopy}]\n`);
        }
        
        const fileToCopyName = fileToCopy.replace(DebugState.recordExt, '');
        const sigFile = fileToCopyName + DebugState.sigExt;
        copyFileSync(
          resolve(srcPath, fileToCopy),
          resolve(destinationPath, fileToCopy)
        );
        copyFileSync(
          resolve(srcPath, sigFile),
          resolve(destinationPath, sigFile)
        );
    }
}
