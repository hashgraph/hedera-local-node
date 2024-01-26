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
import sinon, { SinonStub, SinonStubbedInstance } from 'sinon';
import { CleanUpState } from '../../../src/state/CleanUpState';
import { LoggerService } from '../../../src/services/LoggerService';
import { ServiceLocator } from '../../../src/services/ServiceLocator';
import { CLIService } from '../../../src/services/CLIService';
import { EventType } from '../../../src/types/EventType';
import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';

describe('CleanUpState', () => {
  let cleanUpState: CleanUpState;
  let observerStub: SinonStub;
  let serviceLocatorStub: SinonStub;
  let loggerServiceStub: SinonStubbedInstance<LoggerService>;
  let cliServiceStub: SinonStubbedInstance<CLIService>;

  beforeEach(() => {
    // Mock dependencies
    observerStub = sinon.stub();
    loggerServiceStub = sinon.createStubInstance(LoggerService);
    cliServiceStub = sinon.createStubInstance(CLIService, {
      getCurrentArgv: {
        async: false,
        blocklisting: false,
        balance: 1000,
        accounts: 10,
        startup: false,
      } as any
    });
    serviceLocatorStub = sinon.stub(ServiceLocator.Current, 'get');
    serviceLocatorStub.withArgs('LoggerService').returns(loggerServiceStub);
    serviceLocatorStub.withArgs('CLIService').returns(cliServiceStub);

    // Create an instance of CleanUpState
    cleanUpState = new CleanUpState();
  });

  afterEach(() => {
    // Restore stubs after each test
    serviceLocatorStub.restore();
  });

  describe('subscribe', () => {
    it('should set the observer', () => {
      const observer = { update: sinon.stub() };
      cleanUpState.subscribe(observer);

      // Verify that the observer is set
      expect((cleanUpState as any).observer).to.equal(observer);
    });
  });

  describe('onStart', () => {
    let revertMirrorNodePropertiesStub: SinonStub;
    let revertNodePropertiesStub: SinonStub;

    beforeEach(() => {
      revertNodePropertiesStub = sinon.stub(CleanUpState.prototype, <any>'revertNodeProperties');
      revertMirrorNodePropertiesStub = sinon.stub(CleanUpState.prototype, <any>'revertMirrorNodeProperties');
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
      sinon.assert.calledOnceWithExactly(loggerServiceStub.info, 'Initiating clean up procedure. Trying to revert unneeded changes to files...', 'CleanUpState');
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
      revertNodePropertiesStub = sinon.stub(CleanUpState.prototype, <any>'revertNodeProperties');
      writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
      existsSyncStub = sinon.stub(fs, 'existsSync');
      joinStub = sinon.stub(path, 'join').returns(filePath);
    })

    afterEach(() => {
      revertNodePropertiesStub.restore();
      writeFileSyncStub.restore();
      existsSyncStub.restore();
      joinStub.restore();
    })

    it('should revert mirror node properties', () => {
      // Arrange
      const readFileSyncStub = sinon.stub(fs, 'readFileSync');
      const yamlLoadStub = sinon.stub(yaml, 'load').resolves();
      const yamlDumpStub = sinon.stub(yaml, 'dump').returns('3');
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
      sinon.assert.calledOnce(revertNodePropertiesStub);
      sinon.assert.calledOnceWithExactly(existsSyncStub, 'compose-network/mirror-node/application.yml');
      sinon.assert.calledOnce(readFileSyncStub);
      sinon.assert.calledOnce(yamlLoadStub);
      sinon.assert.calledOnce(writeFileSyncStub);
      sinon.assert.calledOnceWithExactly(writeFileSyncStub, filePath, '3');
      yamlDumpStub.restore();
    });

    it('tests revertMirrorNodeProperties with existsSync false', () => {
      // Arrange
      existsSyncStub.returns(false);

      // Act
      cleanUpState.onStart();

      // Assert
      sinon.assert.calledOnce(existsSyncStub);
      sinon.assert.calledOnce(joinStub);
      sinon.assert.calledThrice(loggerServiceStub.trace);
      sinon.assert.calledWithExactly(loggerServiceStub.trace, `Mirror Node Properties File doesn't exist at path ${filePath}`,'CleanUpState')
    });
  });

  describe('revertNodeProperties', () => {
    it('should revert node properties', () => {
      // Arrange
      sinon.stub(CleanUpState.prototype, <any>'revertMirrorNodeProperties');
      const writeFileSyncStub = sinon.stub(fs, 'writeFileSync');
      const existsSyncStub = sinon.stub(fs, 'existsSync').returns(true);
      const filePath = 'compose-network/mirror-node/application.yml';
      const joinStub = sinon.stub(path, 'join').returns(filePath);

      // Act
       cleanUpState.onStart();

      // Assert
      // Verify that the original properties are written back to the file
      sinon.assert.calledOnce(existsSyncStub);
      sinon.assert.calledOnce(joinStub);
      sinon.assert.calledTwice(loggerServiceStub.trace);
      sinon.assert.calledOnce(writeFileSyncStub);
    });
  });
});
