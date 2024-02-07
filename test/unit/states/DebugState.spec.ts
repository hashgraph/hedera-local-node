/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2024 Hedera Hashgraph, LLC
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

import { expect } from 'chai';
import fs from 'fs';
import { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { LoggerService } from '../../../src/services/LoggerService';
import { CLIService } from '../../../src/services/CLIService';
import { DebugState } from '../../../src/state/DebugState';
import { getTestBed } from '../testBed';
import {
    DEBUG_STATE_INIT_MESSAGE,
    DEBUG_STATE_STARTING_MESSAGE,
    RELATIVE_TMP_DIR_PATH,
    RELATIVE_RECORDS_DIR_PATH
} from '../../../src/constants';
import { resolve } from 'path';
import { Errors } from '../../../src/Errors/LocalNodeErrors';

describe('DebugState tests', () => {
    let debugState: DebugState,
        testSandbox: SinonSandbox, 
        loggerService: SinonStubbedInstance<LoggerService>,
        serviceLocator: SinonStub,
        shellTestBed: {[key: string]: SinonStub},
        cliService: SinonStubbedInstance<CLIService>;

    before(() => {
        const { 
            sandbox,
            loggerServiceStub,
            serviceLocatorStub,
            shellStubs,
            cliServiceStub
        } = getTestBed({
            workDir: 'testDir',
            timestamp: '1234567890.987654321'
        });
    
        testSandbox = sandbox
        loggerService = loggerServiceStub
        serviceLocator = serviceLocatorStub
        shellTestBed = shellStubs
        cliService = cliServiceStub

        debugState = new DebugState();
    });

    afterEach(() => {
        testSandbox.resetHistory();
    });

    it('should initialize the Debug State', async () => {
        expect(debugState).to.be.instanceOf(DebugState);
        testSandbox.assert.calledWith(serviceLocator, 'LoggerService');
        testSandbox.assert.calledOnce(loggerService.trace);
        testSandbox.assert.calledWith(loggerService.trace, DEBUG_STATE_INIT_MESSAGE, DebugState.name);
    })

    it('should have a subscribe method', async () => {
        expect(debugState.subscribe).to.be.a('function');
    })

    describe('onStart', () => {
        it('should execute onStart properly', async () => {
            const { shellExecStub } = shellTestBed;
            const shellCommand = 'docker exec network-node bash /opt/hgcapp/recordParser/parse.sh';
            const getAndValidateTimestampSub = testSandbox.stub(DebugState, <any>'getAndValidateTimestamp');
            const findAndCopyRecordFileToTmpDirStub = testSandbox.stub(DebugState.prototype, <any>'findAndCopyRecordFileToTmpDir');
            const cleanTempDirStub = testSandbox.stub(DebugState, <any>'cleanTempDir');

            await debugState.onStart();
            
            testSandbox.assert.calledWith(shellExecStub, shellCommand);
            testSandbox.assert.calledOnce(loggerService.trace)
            testSandbox.assert.calledWith(loggerService.trace, DEBUG_STATE_STARTING_MESSAGE, DebugState.name);

            getAndValidateTimestampSub.restore();
            findAndCopyRecordFileToTmpDirStub.restore();
            cleanTempDirStub.restore();
        })
    })

    describe('utility methods', () => {
        let unlinkSyncStub: SinonStub,
            getAndValidateTimestampStub: SinonStub,
            findAndCopyRecordFileToTmpDirStub: SinonStub,
            readdirSyncStub: SinonStub,
            tempDir: string,
            cleanTempDirStub: SinonStub,
            recordFilesDirPath: string;

        beforeEach(() => {
            unlinkSyncStub = testSandbox.stub(fs, <any>'unlinkSync');
            getAndValidateTimestampStub = testSandbox.stub(DebugState, <any>'getAndValidateTimestamp');
            findAndCopyRecordFileToTmpDirStub = testSandbox.stub(DebugState.prototype, <any>'findAndCopyRecordFileToTmpDir');
            readdirSyncStub = testSandbox.stub(fs, <any>'readdirSync');
            tempDir = resolve(cliService.getCurrentArgv().workDir, RELATIVE_TMP_DIR_PATH);
            recordFilesDirPath = resolve(cliService.getCurrentArgv().workDir, RELATIVE_RECORDS_DIR_PATH);
            cleanTempDirStub = testSandbox.stub(DebugState, <any>'cleanTempDir');
        })
        
        afterEach(() => {
            unlinkSyncStub.restore();
            getAndValidateTimestampStub.restore();
            findAndCopyRecordFileToTmpDirStub.restore();
            readdirSyncStub.restore();
            cleanTempDirStub.restore();
        })

        it('should test cleanTempDir', async () => {
            cleanTempDirStub.restore();
            readdirSyncStub.returns(['folder1', 'folder2']);
            const unlinkSyncFirstArgument = resolve(tempDir, 'folder1');
            const unlinkSyncSecondArgument = resolve(tempDir, 'folder2');
            await debugState.onStart(); 

            testSandbox.assert.calledOnceWithExactly(readdirSyncStub, tempDir);
            testSandbox.assert.calledTwice(unlinkSyncStub);
            testSandbox.assert.calledWithExactly(unlinkSyncStub.firstCall, unlinkSyncFirstArgument);
            testSandbox.assert.calledWithExactly(unlinkSyncStub.secondCall, unlinkSyncSecondArgument);
        })

        it('should test cleanTempDir when tempfile is gitignore', async () => {
            cleanTempDirStub.restore();
            readdirSyncStub.returns(['.gitignore']);

            await debugState.onStart(); 

            testSandbox.assert.calledOnceWithExactly(readdirSyncStub, tempDir);
            testSandbox.assert.notCalled(unlinkSyncStub) ;
        })

        it('should test getAndValidateTimestamp', async () => {
            getAndValidateTimestampStub.restore();
            const errorStub = testSandbox.stub(Errors, 'INVALID_TIMESTAMP_ERROR');

            await debugState.onStart();

            testSandbox.assert.notCalled(errorStub);

            errorStub.restore();
        })

        it('should test getAndValidateTimestamp with wrong timestamp', async () => {
            getAndValidateTimestampStub.restore();
            cliService.getCurrentArgv.returns({
                async: false,
                blocklisting: false,
                balance: 1000,
                accounts: 10,
                startup: false,
                timestamp: 124544,
                workDir: 'testDir'
            } as any);
            const errorSpy = testSandbox.spy(Errors, 'INVALID_TIMESTAMP_ERROR');

            await debugState.onStart();

            testSandbox.assert.called(errorSpy);
        })

        it('should test findAndCopyRecordFileToTmpDir', async () => {
            findAndCopyRecordFileToTmpDirStub.restore();
            getAndValidateTimestampStub.returns(1707081291338);
            readdirSyncStub.returns(['file1', 'file2', 'file3']);
            const copyFilesTempDirStub = testSandbox.stub(DebugState.prototype, <any>'copyFilesToTmpDir');
            const dateStub = testSandbox.stub(Date.prototype, <any>'getTime');
            dateStub.onSecondCall().returns(1707081291350);

            await debugState.onStart();

            testSandbox.assert.calledOnceWithExactly(copyFilesTempDirStub, ['file1', 'file3'], tempDir, recordFilesDirPath);
            testSandbox.assert.calledOnceWithExactly(readdirSyncStub, recordFilesDirPath);
            testSandbox.assert.calledTwice(dateStub);

            copyFilesTempDirStub.restore();
            dateStub.restore();
        })
        
        it('should test findAndCopyRecordFileToTmpDir throws an error', async () => {
            findAndCopyRecordFileToTmpDirStub.restore();
            getAndValidateTimestampStub.returns(1707081291338);
            readdirSyncStub.returns(['file1', 'file2', 'file3']);
            const copyFilesTempDirStub = testSandbox.stub(DebugState.prototype, <any>'copyFilesToTmpDir');
            const dateStub = testSandbox.stub(Date.prototype, <any>'getTime').returns(1707081291337);
            const errorSpy = testSandbox.spy(Errors, 'NO_RECORD_FILE_FOUND_ERROR');

            await debugState.onStart();

            testSandbox.assert.calledOnceWithExactly(readdirSyncStub, recordFilesDirPath);
            testSandbox.assert.calledOnce(errorSpy);
            testSandbox.assert.notCalled(copyFilesTempDirStub);
            testSandbox.assert.calledTwice(dateStub);

            copyFilesTempDirStub.restore();
            dateStub.restore();
            errorSpy.restore();
        })

        it('should test copyFilesToTmpDir', async () => {
            findAndCopyRecordFileToTmpDirStub.restore();
            getAndValidateTimestampStub.returns(1707081291338);
            readdirSyncStub.returns(['file1', 'file2', 'file3']);
            const copyFileToDirStub = testSandbox.stub(DebugState.prototype, <any>'copyFileToDir');
            const dateStub = testSandbox.stub(Date.prototype, <any>'getTime');
            dateStub.onSecondCall().returns(1707081291350);

            await debugState.onStart();

            testSandbox.assert.calledTwice(copyFileToDirStub);
            testSandbox.assert.calledWithExactly(copyFileToDirStub.getCall(0), 'file1', recordFilesDirPath, tempDir);
            testSandbox.assert.calledWithExactly(copyFileToDirStub.getCall(1), 'file3', recordFilesDirPath, tempDir);

            readdirSyncStub.restore();
            dateStub.restore();
            copyFileToDirStub.restore();
        })

        it('should test copyFileToDir', async () => {
            findAndCopyRecordFileToTmpDirStub.restore();
            getAndValidateTimestampStub.returns(1707081291338);
            const copyFileSyncStub = testSandbox.stub(fs, <any>'copyFileSync');
            readdirSyncStub.returns(['file1', 'file2', 'file3']);
            const dateStub = testSandbox.stub(Date.prototype, <any>'getTime');
            dateStub.onSecondCall().returns(1707081291350);

            await debugState.onStart();

            expect(copyFileSyncStub.callCount).to.be.eq(4);
            dateStub.restore();
            copyFileSyncStub.restore();
        })
    })
});
