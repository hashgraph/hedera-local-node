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
import sinon from "sinon";
import shell from 'shelljs';
import { LoggerService } from "../../src/services/LoggerService";
import { CLIService } from "../../src/services/CLIService";
import { ServiceLocator } from "../../src/services/ServiceLocator";
import { DockerService } from "../../src/services/DockerService";
import { ConnectionService } from "../../src/services/ConnectionService";
import { ClientService } from "../../src/services/ClientService";

export interface LocalNodeTestBed {
    sandbox: sinon.SinonSandbox;
    loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
    cliServiceStub: sinon.SinonStubbedInstance<CLIService>;
    dockerServiceStub: sinon.SinonStubbedInstance<DockerService>;
    connectionServiceStub: sinon.SinonStubbedInstance<ConnectionService>;
    clientServiceStub: sinon.SinonStubbedInstance<ClientService>;
    serviceLocatorStub: sinon.SinonStub;
    proccesStubs: {
        processCWDStub: sinon.SinonStub;
        processPlatformStub: sinon.SinonStub;
    },
    shellStubs: {
        shellCDStub: sinon.SinonStub;
        shellExecStub: sinon.SinonStub;
    }
}

let testBed: LocalNodeTestBed;

export function getTestBed(cliServiceArgs?: any) {
    if (testBed) {
        resetTestBedHistory(testBed)
        if (cliServiceArgs) {
            testBed.cliServiceStub.getCurrentArgv.returns({
                ...cliServiceArgs
            })
        }
        
        return {
            ...testBed
        };
    }

    const sandbox = sinon.createSandbox();
    testBed = {
        sandbox,
        ...generateProccessStub(sandbox),
        ...generateShellStubs(sandbox),
        ...generateLocalNodeStubs(sandbox, cliServiceArgs),
    }

    return testBed;
}

function resetTestBedHistory(testBead: LocalNodeTestBed) {
    testBead.sandbox.resetHistory();
}

function generateLocalNodeStubs(sandbox:sinon.SinonSandbox, cliServiceArgs?: any) {
    const dockerServiceStub = sandbox.createStubInstance(DockerService);
    const connectionServiceStub = sandbox.createStubInstance(ConnectionService);
    const loggerServiceStub = sandbox.createStubInstance(LoggerService);
    const clientServiceStub = sandbox.createStubInstance(ClientService);
    const cliServiceStub = sandbox.createStubInstance(CLIService, {
      getCurrentArgv: {
        ...cliServiceArgs,
      } as any
    });

    const getStub = sandbox.stub();
    getStub.withArgs(LoggerService.name).returns(loggerServiceStub);
    getStub.withArgs(CLIService.name).returns(cliServiceStub);
    getStub.withArgs(DockerService.name).returns(dockerServiceStub);
    getStub.withArgs(ConnectionService.name).returns(connectionServiceStub);
    getStub.withArgs(ClientService.name).returns(clientServiceStub);

    sandbox.replaceGetter(ServiceLocator, 'Current', () => sandbox.createStubInstance(ServiceLocator, {
        get: getStub
    }));

    return {
        clientServiceStub,
        connectionServiceStub,
        dockerServiceStub,
        loggerServiceStub,
        cliServiceStub,
        serviceLocatorStub: getStub
    }
}

function generateProccessStub(sandbox: sinon.SinonSandbox) {
    const processCWDStub = sandbox.stub(process, 'cwd').returns('testDir');
    const processPlatformStub = sandbox.stub(process, 'platform').returns('testPlatform');

    return {
        proccesStubs : {
            processCWDStub,
            processPlatformStub
    }}
}

function generateShellStubs(sandbox: sinon.SinonSandbox) {
    const shellCDStub = sandbox.stub(shell, 'cd');
    const shellExecStub = sandbox.stub(shell, 'exec');

    return {
        shellStubs :{
            shellCDStub,
            shellExecStub
    }}
}
