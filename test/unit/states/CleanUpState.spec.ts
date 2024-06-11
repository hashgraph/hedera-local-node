/*-
 *
 * Hedera Local Node
 *
 * Copyright (C) 2023-2024 Hedera Hashgraph, LLC
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
import { CleanUpState } from '../../../src/state/CleanUpState';
import { LoggerService } from '../../../src/services/LoggerService';
import { EventType } from '../../../src/types/EventType';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import { SinonSandbox, SinonStub, SinonStubbedInstance } from 'sinon';
import { getTestBed } from '../testBed';
import { LOADING } from '../../../src/constants';

describe('CleanUpState', () => {
  let cleanUpState: CleanUpState;
  let observerStub: SinonStub;
  let testSandbox: SinonSandbox, 
      loggerService: SinonStubbedInstance<LoggerService>;

  beforeEach(() => {
    const { 
      sandbox,
      loggerServiceStub,
    } = getTestBed({
      workDir: 'testDir',
      async: false
    });
    testSandbox = sandbox;
    // Mock dependencies
    observerStub = testSandbox.stub();
    loggerService = loggerServiceStub;

    // Create an instance of CleanUpState
    cleanUpState = new CleanUpState();
  });

  after(() => {
    testSandbox.resetHistory();
  });

  describe('subscribe', () => {
    it('should set the observer', () => {
      const observer = { update: testSandbox.stub() };
      cleanUpState.subscribe(observer);

      // Verify that the observer is set
      expect((cleanUpState as any).observer).to.equal(observer);
    });
  });

  describe('onStart', () => {
    let revertMirrorNodePropertiesStub: SinonStub;
    let revertNodePropertiesStub: SinonStub;

    beforeEach(() => {
      revertNodePropertiesStub = testSandbox.stub(CleanUpState.prototype, <any>'revertNodeProperties');
      revertMirrorNodePropertiesStub = testSandbox.stub(CleanUpState.prototype, <any>'revertMirrorNodeProperties');
    })

    afterEach(() => {
      revertNodePropertiesStub.restore();
      revertMirrorNodePropertiesStub.restore();
    })

    it('should call revertNodeProperties and revertMirrorNodeProperties', async () => {
      // Act
      await cleanUpState.onStart();

      // Assert
      // Verify that revertNodeProperties and revertMirrorNodeProperties are called
      expect(revertNodePropertiesStub.calledOnce).to.be.true;
      expect(revertMirrorNodePropertiesStub.calledOnce).to.be.true;
      testSandbox.assert.calledOnceWithExactly(loggerService.info, `${LOADING} Initiating clean up procedure. Trying to revert unneeded changes to files...`, 'CleanUpState');
    });

    it('should call observer.update with EventType.Finish', async () => {
      // Arrange
      (cleanUpState as any).observer = { update: observerStub };

      // Act
      await cleanUpState.onStart();

      // Assert
      expect(observerStub.calledOnceWithExactly(EventType.Finish)).to.be.true;
    });
  });

  describe('revertMirrorNodeProperties', () => {
    let revertNodePropertiesStub: SinonStub;
    let writeFileSyncStub: SinonStub;
    let existsSyncStub: SinonStub;
    let joinStub: SinonStub;
    const filePath = 'compose-network/mirror-node/application.yml';

    beforeEach(() => {
      revertNodePropertiesStub = testSandbox.stub(CleanUpState.prototype, <any>'revertNodeProperties');
      writeFileSyncStub = testSandbox.stub(fs, 'writeFileSync');
      existsSyncStub = testSandbox.stub(fs, 'existsSync');
      joinStub = testSandbox.stub(path, 'join').returns(filePath);
    })

    afterEach(() => {
      revertNodePropertiesStub.restore();
      writeFileSyncStub.restore();
      existsSyncStub.restore();
      joinStub.restore();
    })


    it('should revert mirror node properties', () => {
      // Arrange
      const readFileSyncStub = testSandbox.stub(fs, 'readFileSync');
      const yamlLoadStub = testSandbox.stub(yaml, 'load').resolves();
      const yamlDumpStub = testSandbox.stub(yaml, 'dump').returns('3');
      existsSyncStub.returns(true);
      // Mock file operations
      const fileContent = '...'; // original content
      readFileSyncStub.withArgs(filePath).returns(fileContent);
      yamlLoadStub.withArgs(fileContent).returns({
        hedera: {
          mirror: {
            importer: {
              dataPath: 'some-data-path',
              downloader: {
                sources: 'some-sources',
                local: 'some-local',
              },
            },
            monitor: {
              nodes: 'some-nodes',
            },
          },
        },
      });

      // Act
      cleanUpState.onStart();

      // Assert
      // Verify that the properties are deleted and the file is updated
      testSandbox.assert.calledOnce(revertNodePropertiesStub);
      testSandbox.assert.calledOnceWithExactly(existsSyncStub, 'compose-network/mirror-node/application.yml');
      testSandbox.assert.calledOnce(readFileSyncStub);
      testSandbox.assert.calledOnce(yamlLoadStub);
      testSandbox.assert.calledOnce(writeFileSyncStub);
      testSandbox.assert.calledOnceWithExactly(writeFileSyncStub, filePath, '3');
      yamlDumpStub.restore();
      readFileSyncStub.restore();
      yamlLoadStub.restore();
    });

    it('tests revertMirrorNodeProperties with existsSync false', () => {
      // Arrange
      existsSyncStub.returns(false);

      // Act
      cleanUpState.onStart();

      // Assert
      testSandbox.assert.calledOnce(existsSyncStub);
      testSandbox.assert.calledOnce(joinStub);
      testSandbox.assert.calledThrice(loggerService.trace);
      testSandbox.assert.calledWithExactly(loggerService.trace, `Mirror Node Properties File doesn't exist at path ${filePath}`,'CleanUpState')
    });
  });

  describe('revertNodeProperties', () => {
    it('should revert node properties', () => {
      // Arrange
      testSandbox.stub(CleanUpState.prototype, <any>'revertMirrorNodeProperties');
      const writeFileSyncStub = testSandbox.stub(fs, 'writeFileSync');
      const existsSyncStub = testSandbox.stub(fs, 'existsSync').returns(true);
      const filePath = 'compose-network/mirror-node/application.yml';
      const joinStub = testSandbox.stub(path, 'join').returns(filePath);

      // Act
       cleanUpState.onStart();

      // Assert
      // Verify that the original properties are written back to the file
      testSandbox.assert.calledOnce(existsSyncStub);
      testSandbox.assert.calledOnce(joinStub);
      testSandbox.assert.calledTwice(loggerService.trace);
      testSandbox.assert.calledOnce(writeFileSyncStub);

      writeFileSyncStub.restore();
      existsSyncStub.restore();
      joinStub.restore();

    });
  });
});
