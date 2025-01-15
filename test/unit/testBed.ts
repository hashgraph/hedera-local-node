// SPDX-License-Identifier: Apache-2.0

import sinon from 'sinon';
import shell from 'shelljs';
import { LoggerService } from '../../src/services/LoggerService';
import { CLIService } from '../../src/services/CLIService';
import { ServiceLocator } from '../../src/services/ServiceLocator';
import { DockerService } from '../../src/services/DockerService';
import { ConnectionService } from '../../src/services/ConnectionService';
import { ClientService } from '../../src/services/ClientService';
import { CLIOptions } from '../../src/types/CLIOptions';
import { AccountId, Client, PrivateKey } from '@hashgraph/sdk';

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

export function getTestBed(cliServiceArgs?: Partial<CLIOptions>) {
    if (testBed) {
        resetTestBedHistory(testBed)
        if (cliServiceArgs) {
            testBed.cliServiceStub.getCurrentArgv.returns({
                ...cliServiceArgs
            } as CLIOptions)
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
    const clientServiceStub = sandbox.createStubInstance(ClientService, {
        getClient: Client.forLocalNode().setOperator(
          AccountId.fromString('0.0.2'),
          PrivateKey.fromStringED25519('302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137')
        )
    });
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
