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
import yaml from 'js-yaml';
import { join } from 'path';
import { SinonSandbox, SinonSpy, SinonStub, SinonStubbedInstance } from 'sinon';
import {
  APPLICATION_YML_RELATIVE_PATH,
  CHECK_SUCCESS,
  INIT_STATE_BOOTSTRAPPED_PROP_SET,
  INIT_STATE_CONFIGURING_ENV_VARIABLES_FINISH,
  INIT_STATE_INIT_MESSAGE,
  INIT_STATE_MIRROR_PROP_SET,
  INIT_STATE_NO_ENV_VAR_CONFIGURED,
  INIT_STATE_NO_NODE_CONF_NEEDED,
  INIT_STATE_RELAY_LIMITS_DISABLED,
  INIT_STATE_START_DOCKER_CHECK,
  INIT_STATE_STARTING_MESSAGE,
  NECESSARY_PORTS,
  NETWORK_NODE_CONFIG_DIR_PATH,
  OPTIONAL_PORTS,
  RECORD_PARSER_SOURCE_REL_PATH
} from '../../../src/constants';
import { ConfigurationData } from '../../../src/data/ConfigurationData';
import { CLIService } from '../../../src/services/CLIService';
import { DockerService } from '../../../src/services/DockerService';
import { LoggerService } from '../../../src/services/LoggerService';
import { InitState } from '../../../src/state/InitState';
import { EventType } from '../../../src/types/EventType';
import { FileSystemUtils } from '../../../src/utils/FileSystemUtils';
import { getTestBed } from '../testBed';

describe('InitState tests', () => {
    let initState: InitState,
        testSandbox: SinonSandbox,
        loggerService: SinonStubbedInstance<LoggerService>,
        serviceLocator: SinonStub,
        cliService: SinonStubbedInstance<CLIService>,
        dockerService: SinonStubbedInstance<DockerService>,
        observerSpy: SinonSpy,
        configurationData: SinonStub,
        prepareWorkDirectoryStub: SinonStub,
        configureEnvVariablesStub: SinonStub,
        configureNodePropertiesStub: SinonStub,
        configureMirrorNodePropertiesStub: SinonStub,
        extractImageTagStub: SinonStub;

    const TEST_CONFIGURATION = {
        imageTagConfiguration: [
            { key: "TEST_VAR_1", value: 'test'}
        ],
        envConfiguration: [
            { key: "TEST_VAR_2", value: 'test'}
        ],
        nodeConfiguration: {
            properties: [
                { key: "TEST_VAR_3", value: 'test'}
            ],
        },
    }

    const stubPrivateFunctions = () => {
        prepareWorkDirectoryStub = testSandbox.stub(initState as any, 'prepareWorkDirectory')
        configureEnvVariablesStub = testSandbox.stub(initState as any, 'configureEnvVariables')
        configureNodePropertiesStub = testSandbox.stub(initState as any, 'configureNodeProperties')
        configureMirrorNodePropertiesStub = testSandbox.stub(initState as any, 'configureMirrorNodeProperties')
        extractImageTagStub = testSandbox.stub(initState as any, 'extractImageTag').returns({
            node: TEST_CONFIGURATION.imageTagConfiguration[0].key,
            tag: TEST_CONFIGURATION.imageTagConfiguration[0].value,
        })
    }

    before(() => {
        const {
            sandbox,
            loggerServiceStub,
            serviceLocatorStub,
            dockerServiceStub,
            cliServiceStub
        } = getTestBed({
            workDir: 'testDir',
            fullMode: true,
            enableDebug: true,
            multiNode: true,
            networkTag: 'test-network-tag',
            mirrorTag: 'test-mirror-tag',
            relayTag: 'test-relay-tag',
        });

        testSandbox = sandbox
        dockerService = dockerServiceStub
        cliService = cliServiceStub
        loggerService = loggerServiceStub
        serviceLocator = serviceLocatorStub

        initState = new InitState();
        observerSpy = testSandbox.spy();
        const observer = {
            update: observerSpy
        }
        initState.subscribe(observer);
        configurationData = testSandbox.stub(ConfigurationData, 'getSelectedConfigurationData').callsFake(() => TEST_CONFIGURATION)
        stubPrivateFunctions()
    });

    afterEach(() => {
        testSandbox.resetHistory();
        observerSpy.resetHistory();
        dockerService.isCorrectDockerComposeVersion.reset()
        dockerService.checkDocker.reset()
        dockerService.checkDockerResources.reset()
    });

    it('should initialize the Init State', async () => {
        expect(initState).to.be.instanceOf(InitState);
        testSandbox.assert.calledWith(serviceLocator, LoggerService.name);
        testSandbox.assert.calledWith(serviceLocator, DockerService.name);
        testSandbox.assert.calledWith(serviceLocator, CLIService.name);
        testSandbox.assert.calledOnceWithExactly(loggerService.trace, INIT_STATE_INIT_MESSAGE, InitState.name);
    })

    it('should have a subscribe method', async () => {
        expect(initState.subscribe).to.be.a('function');
    })

    it('should execute onStart', async () => {
        dockerService.isCorrectDockerComposeVersion.resolves(true)
        dockerService.checkDocker.resolves(true)
        dockerService.checkDockerResources.resolves(true)

        await initState.onStart();

        // loggin messages
        testSandbox.assert.calledWithExactly(loggerService.trace, INIT_STATE_STARTING_MESSAGE, InitState.name);
        testSandbox.assert.calledOnce(configurationData)
        testSandbox.assert.calledWithExactly(loggerService.info, INIT_STATE_START_DOCKER_CHECK, InitState.name);
        testSandbox.assert.calledOnce(dockerService.isCorrectDockerComposeVersion);
        testSandbox.assert.calledOnce(dockerService.checkDocker);
        testSandbox.assert.calledOnce(dockerService.checkDockerResources);

        testSandbox.assert.calledOnceWithExactly(dockerService.isPortInUse, NECESSARY_PORTS.concat(OPTIONAL_PORTS));
        testSandbox.assert.calledWith(observerSpy, EventType.Finish);
        testSandbox.assert.calledOnce(prepareWorkDirectoryStub);
        testSandbox.assert.calledOnce(configureEnvVariablesStub);
        testSandbox.assert.calledOnce(configureNodePropertiesStub);
        testSandbox.assert.calledOnce(configureMirrorNodePropertiesStub);

        testSandbox.assert.notCalled(loggerService.initializeTerminalUI);
    })

    it('should execute onStart and finish with UnresolvableError on docker checks (Compose Version, Docker Running, Resources)', async () => {
        dockerService.isCorrectDockerComposeVersion.resolves(false);
        await initState.onStart();

        // loggin messages
        testSandbox.assert.calledOnceWithExactly(loggerService.trace, INIT_STATE_STARTING_MESSAGE, InitState.name);
        testSandbox.assert.calledOnce(configurationData)
        testSandbox.assert.calledOnceWithExactly(loggerService.info, INIT_STATE_START_DOCKER_CHECK, InitState.name);
        testSandbox.assert.calledOnce(dockerService.isCorrectDockerComposeVersion);
        testSandbox.assert.calledOnce(dockerService.checkDocker);
        testSandbox.assert.calledOnce(dockerService.checkDockerResources);

        testSandbox.assert.calledWith(observerSpy, EventType.UnresolvableError);

        testSandbox.assert.notCalled(dockerService.isPortInUse);
        testSandbox.assert.notCalled(loggerService.initializeTerminalUI);
    })

    describe('private functions', () => {
        let createEphemeralDirectoriesStub: SinonStub,
            copyPathsStub: SinonStub,
            onStartStub: SinonStub,
            fsWriteFileSync: SinonStub,
            fsReadFileSync: SinonStub,
            ymlLoad: SinonStub,
            ymlDump: SinonStub;
        const rootDirSource = join(__dirname, `../`);

        const configDirSource = join(rootDirSource, `../../${NETWORK_NODE_CONFIG_DIR_PATH}`);
        const configPathMirrorNodeSource = join(rootDirSource, `../../${APPLICATION_YML_RELATIVE_PATH}`);
        const recordParserSource = join(rootDirSource, RECORD_PARSER_SOURCE_REL_PATH);
        const configFiles = {
            [configDirSource]: `testDir/${NETWORK_NODE_CONFIG_DIR_PATH}`,
            [configPathMirrorNodeSource]: `testDir/${APPLICATION_YML_RELATIVE_PATH}`,
            [recordParserSource]: `testDir/services/record-parser`
        };

        before(() => {
            createEphemeralDirectoriesStub = testSandbox.stub(FileSystemUtils, "createEphemeralDirectories").callsFake(() => {})
            copyPathsStub = testSandbox.stub(FileSystemUtils, "copyPaths").callsFake(() => {})
            fsWriteFileSync = testSandbox.stub(fs, 'writeFileSync');
            fsReadFileSync = testSandbox.stub(fs, 'readFileSync').returns('test');
            ymlLoad = testSandbox.stub(yaml, 'load').returns({
                hedera: {
                    mirror: {
                        importer: {
                            dataPath: {
                            },
                            downloader: {
                                local: {}
                            },
                            parser: {
                                record: {
                                    entity: {
                                        persist: {
                                            transactionBytes: false,
                                            transactionRecordBytes: false
                                        }
                                    }
                                }
                            }
                        },
                        monitor: {
                            nodes: {}
                        }
                    }
                }
            });
            ymlDump = testSandbox.stub(yaml, 'dump');
        })

        afterEach(() => {
            onStartStub.restore()
        })

        it('should execute "prepareWorkDirectory" as expected', async () => {
            prepareWorkDirectoryStub.restore()

            onStartStub = testSandbox.stub(initState, 'onStart')
                .callsFake(() => (initState  as any).prepareWorkDirectory())
            await initState.onStart();
            testSandbox.assert.calledWithExactly(loggerService.info, `${CHECK_SUCCESS} Local Node Working directory set to testDir.`, InitState.name);
            testSandbox.assert.calledOnceWithExactly(createEphemeralDirectoriesStub, "testDir");
            testSandbox.assert.calledOnceWithExactly(copyPathsStub, configFiles);

            prepareWorkDirectoryStub = testSandbox.stub(initState as any, 'prepareWorkDirectory')
        })

        it('should execute "configureEnvVariables" as expected', async () => {
            configureEnvVariablesStub.restore()

            onStartStub = testSandbox.stub(initState, 'onStart')
                .callsFake(() => (initState  as any).configureEnvVariables(
                    TEST_CONFIGURATION.imageTagConfiguration,
                    TEST_CONFIGURATION.envConfiguration,
                ))
            await initState.onStart();

            testSandbox.assert.match(process.env.TEST_VAR_1, 'test');
            testSandbox.assert.match(process.env.TEST_VAR_2, 'test');
            testSandbox.assert.called(loggerService.trace);
            testSandbox.assert.called(extractImageTagStub);
            testSandbox.assert.calledWithExactly(loggerService.info, INIT_STATE_CONFIGURING_ENV_VARIABLES_FINISH, InitState.name);
            testSandbox.assert.calledWithExactly(loggerService.info, INIT_STATE_RELAY_LIMITS_DISABLED, InitState.name);

            configureEnvVariablesStub = testSandbox.stub(initState as any, 'configureEnvVariables')
        })

        it('should execute "configureEnvVariables" as expected (NO ENV configured)', async () => {
            configureEnvVariablesStub.restore()

            onStartStub = testSandbox.stub(initState, 'onStart')
                .callsFake(() => (initState  as any).configureEnvVariables(
                    TEST_CONFIGURATION.imageTagConfiguration,
                ))
            await initState.onStart();

            testSandbox.assert.calledWithExactly(loggerService.trace, INIT_STATE_NO_ENV_VAR_CONFIGURED, InitState.name);

            configureEnvVariablesStub = testSandbox.stub(initState as any, 'configureEnvVariables')
        })

        it('should execute "extractImageTag" as expected and return "NETWORK_NODE_IMAGE_TAG"', async () => {
            extractImageTagStub.restore()

            const {tag, node} = (initState as any).extractImageTag({
                key: "NETWORK_NODE_IMAGE_TAG",
                value: 'test'
            })
            expect(tag).to.be.equal('test-network-tag');
            expect(node).to.be.equal('NETWORK_NODE_IMAGE_TAG');
        })

        it('should execute "extractImageTag" as expected and return "MIRROR_IMAGE_TAG"', async () => {
            extractImageTagStub.restore()

            const {tag, node} = (initState as any).extractImageTag({
                key: "MIRROR_IMAGE_TAG",
                value: 'test'
            })
            expect(tag).to.be.equal('test-mirror-tag');
            expect(node).to.be.equal('MIRROR_IMAGE_TAG');
        })

        it('should execute "extractImageTag" as expected and return "RELAY_IMAGE_TAG"', async () => {
            extractImageTagStub.restore()

            const {tag, node} = (initState as any).extractImageTag({
                key: "RELAY_IMAGE_TAG",
                value: 'test'
            })
            expect(tag).to.be.equal('test-relay-tag');
            expect(node).to.be.equal('RELAY_IMAGE_TAG');
        })

        it('should execute "configureNodeProperties" as write to file', async () => {
            configureNodePropertiesStub.restore()
            onStartStub = testSandbox.stub(initState, 'onStart')
                .callsFake(() => (initState  as any).configureNodeProperties(
                    TEST_CONFIGURATION.nodeConfiguration.properties
                ))
            await initState.onStart();
            testSandbox.assert.calledWithExactly(loggerService.info, INIT_STATE_BOOTSTRAPPED_PROP_SET, InitState.name);
            testSandbox.assert.called(fsWriteFileSync);

            configureNodePropertiesStub = testSandbox.stub(initState as any, 'configureNodeProperties')
        })

        it('should execute "configureNodeProperties" as write to file (No additional node configuration needed)', async () => {
            configureNodePropertiesStub.restore()
            onStartStub = testSandbox.stub(initState, 'onStart')
                .callsFake(() => (initState  as any).configureNodeProperties())
            await initState.onStart();
            testSandbox.assert.calledWithExactly(loggerService.trace, INIT_STATE_NO_NODE_CONF_NEEDED, InitState.name);
            testSandbox.assert.notCalled(fsWriteFileSync);

            configureNodePropertiesStub = testSandbox.stub(initState as any, 'configureNodeProperties')
        })

        it('should execute "configureMirrorNodeProperties" as write to file', async () => {
            configureMirrorNodePropertiesStub.restore()

            onStartStub = testSandbox.stub(initState, 'onStart')
            .callsFake(() => (initState  as any).configureMirrorNodeProperties())
            await initState.onStart();
            testSandbox.assert.calledOnceWithExactly(loggerService.info, INIT_STATE_MIRROR_PROP_SET, InitState.name);
            testSandbox.assert.called(fsReadFileSync);
            testSandbox.assert.called(fsWriteFileSync);
            testSandbox.assert.called(ymlLoad);
            testSandbox.assert.called(ymlDump);

            configureMirrorNodePropertiesStub = testSandbox.stub(initState as any, 'configureMirrorNodeProperties')
        })

        describe('when persistTransactionBytes is set to true', () => {
            let cliOptionsStub: SinonStub;

            const expectedMirrorProperties = {
                hedera: {
                    mirror: {
                        importer : {
                            parser: {
                                record: {
                                    entity: {
                                        persist: {
                                            transactionBytes: true,
                                            transactionRecordBytes: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            };

            before(() => {
                cliOptionsStub = testSandbox.stub((initState  as any), 'cliOptions').value({
                    ...cliService.getCurrentArgv(),
                    persistTransactionBytes: true
                });
                configureMirrorNodePropertiesStub.restore();
                onStartStub = testSandbox.stub(initState, 'onStart')
                  .callsFake(() => (initState  as any).configureMirrorNodeProperties());
            })

            after(() => {
                cliOptionsStub.restore();
                configureMirrorNodePropertiesStub = testSandbox.stub(initState as any, 'configureMirrorNodeProperties');
            })

            it('should set the persist properties for transactionBytes and transactionRecordBytes to true', async () => {
                await initState.onStart();
                testSandbox.assert.calledOnceWithExactly(loggerService.info, INIT_STATE_MIRROR_PROP_SET, InitState.name);
                testSandbox.assert.called(fsReadFileSync);
                testSandbox.assert.called(fsWriteFileSync);
                testSandbox.assert.called(ymlLoad);
                testSandbox.assert.calledWithMatch(ymlDump, expectedMirrorProperties);
            })
        })
    })
});
