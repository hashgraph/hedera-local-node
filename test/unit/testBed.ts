import sinon from "sinon";
import shell from 'shelljs';
import { LoggerService } from "../../src/services/LoggerService";
import { CLIService } from "../../src/services/CLIService";
import { ServiceLocator } from "../../src/services/ServiceLocator";
import { DockerService } from "../../src/services/DockerService";
import { ConnectionService } from "../../src/services/ConnectionService";

export interface LocalNodeTestBed {
    sandbox: sinon.SinonSandbox;
    loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
    cliServiceStub: sinon.SinonStubbedInstance<CLIService>;
    dockerServiceStub: sinon.SinonStubbedInstance<DockerService>;
    connectionServiceStub: sinon.SinonStubbedInstance<ConnectionService>;
    serviceLocatorStub: sinon.SinonStub;
    proccesStubs: {
        processCWDStub: sinon.SinonStub;
        processPlatformStub: sinon.SinonStub
    },
    shellStubs: {
        shellCDStub: sinon.SinonStub;
        shellExecStub: sinon.SinonStub;
    }
}

let testBead: LocalNodeTestBed

export function getTestBed(cliServiceArgs?: any) {
    if (testBead) {
        resetTestBedHistory(testBead)
        return {
            ...testBead
        };
    }

    const sandbox = sinon.createSandbox();
    testBead = {
        sandbox,
        ...generateProccessStub(sandbox),
        ...generateShellStubs(sandbox),
        ...generateLocalNodeStubs(sandbox, cliServiceArgs),
    }

    return testBead;
}

function resetTestBedHistory(testBead: LocalNodeTestBed) {
    testBead.sandbox.resetHistory();
    // testBead.loggerServiceStub.trace.resetHistory();
    // testBead.loggerServiceStub.info.resetHistory();
    // testBead.proccesStubs.processCWDStub.resetHistory();
    // testBead.proccesStubs.processPlatformStub.resetHistory();
}

function generateLocalNodeStubs(sandbox:sinon.SinonSandbox, cliServiceArgs?: any) {
    const dockerServiceStub = sandbox.createStubInstance(DockerService);
    const connectionServiceStub = sandbox.createStubInstance(ConnectionService);
    const loggerServiceStub = sandbox.createStubInstance(LoggerService);
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

    sandbox.replaceGetter(ServiceLocator, 'Current', () => sandbox.createStubInstance(ServiceLocator, {
        get: getStub
    }));

    return {
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