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

/**
 * Represents the debug state of the Hedera Local Node.
 * @implements {IState}
 * @property {LoggerService} logger - The logger service.
 * @property {string} stateName - The name of the state.
 * @property {string} recordExt - The file extension for the record file. This is a static property.
 * @property {string} sigExt - The file extension for the signature file. This is a static property.
 */
export class DebugState implements IState{
    private logger: LoggerService;
    
    private stateName: string;

    private static readonly recordExt = `.${process.env.STREAM_EXTENSION}`;
    private static readonly sigExt = `.${process.env.STREAM_SIG_EXTENSION}`;
    
    constructor() {
        this.stateName = DebugState.name;
        this.logger = ServiceLocator.Current.get<LoggerService>(LoggerService.name);
        this.logger.trace('Debug State Initialized!', this.stateName);
    }

    public subscribe(observer: IOBserver): void {
    }

    /**
     * Starts the DebugState.
     * 
     * This method performs the following steps:
     * 1. Retrieves the current timestamp from the command line arguments.
     * 2. Validates the timestamp.
     * 3. Resolves the paths for the temporary directory and the record files directory.
     * 4. Finds and copies the record file to the temporary directory based on the timestamp.
     * 5. Executes a shell command to parse the record file using a Docker container.
     * 
     * @public
     * @async
     * @returns {Promise<void>} A Promise that resolves when the DebugState has started and the record file has been parsed.
     */
    public async onStart(): Promise<void> {
        try {
            const { timestamp, workDir } = ServiceLocator.Current.get<CLIService>(CLIService.name).getCurrentArgv();
            // DebugState.checkForDebugMode();
            this.logger.trace('Debug State Starting...', this.stateName);
            const jsTimestampNum = DebugState.getAndValidateTimestamp(timestamp)

            const tempDir = resolve(workDir, RELATIVE_TMP_DIR_PATH);
            const recordFilesDirPath = resolve(workDir, RELATIVE_RECORDS_DIR_PATH);
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

    /**
     * Cleans the temporary directory.
     * 
     * This method iterates over all the files in the specified directory and deletes them, except for the '.gitignore' file.
     * 
     * @static
     * @param {string} dirPath - The path to the directory to clean.
     */
    private static cleanTempDir(dirPath: string): void {
        for (const tempFile of readdirSync(dirPath)) {
            if (tempFile !== '.gitignore') {
              unlinkSync(resolve(dirPath, tempFile));
            }
        }
    }

    /**
     * Gets and validates the timestamp.
     * 
     * This method checks if the provided timestamp matches the expected format. If it does, it parses the timestamp into a number and returns it.
     * 
     * @static
     * @param {string} timestamp - The timestamp to validate.
     * @returns {number} The parsed timestamp.
     * @throws {Error} Throws an error if the timestamp does not match the expected format.
     */
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

    /**
     * Finds and copies the record file to the temporary directory.
     * 
     * This method iterates over all the files in the record files directory and finds the first file,
     * whose timestamp is greater than or equal to the provided timestamp.
     * It then copies this file and the previous file to the temporary directory.
     * 
     * @param {number} jsTimestampNum - The timestamp to compare against.
     * @param {string} recordFilesDirPath - The path to the directory containing the record files.
     * @param {string} tmpDirPath - The path to the temporary directory.
     * @throws {Error} Throws an error if no record file can be found.
     */
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

    /**
     * Copies files to the temporary directory.
     * 
     * This method takes a list of files or a single file and copies them from the record files directory to the temporary directory.
     * 
     * @param {string | Array<string>} filesToCopy - The file or files to copy.
     * @param {string} tmpDirPath - The path to the temporary directory.
     * @param {string} recordFilesDirPath - The path to the directory containing the record files.
     */
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

    /**
     * Copies a file to a directory.
     * 
     * This method takes a file and copies it from the source path to the destination path.
     * 
     * @param {string} fileToCopy - The name of the file to copy.
     * @param {string} srcPath - The source path of the file.
     * @param {string} destinationPath - The destination path where the file should be copied.
     */
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
