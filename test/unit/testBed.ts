import sinon from "sinon";
import { LoggerService } from "../../src/services/LoggerService";
import { CLIService } from "../../src/services/CLIService";
import { ServiceLocator } from "../../src/services/ServiceLocator";
import { DockerService } from "../../src/services/DockerService";
import { ConnectionService } from "../../src/services/ConnectionService";

export interface LocalNodeTestBed {
    sandbox: sinon.SinonSandbox;
    loggerServiceStub: sinon.SinonStubbedInstance<LoggerService>;
    cliServiceStub: sinon.SinonStubbedInstance<CLIService>;
    serviceLocatorStub: sinon.SinonStub;
}

let testBead: LocalNodeTestBed

export function getTestBed(cliServiceArgs?: any) {
    if (testBead) {
        testBead.sandbox.resetHistory();
        testBead.loggerServiceStub.trace.resetHistory();
        return {
            ...testBead
        };
    }

    const sandbox = sinon.createSandbox();
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

    testBead = {
        sandbox,
        loggerServiceStub,
        cliServiceStub,
        serviceLocatorStub: getStub
    }

    return testBead;
}