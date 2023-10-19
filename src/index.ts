#!/usr/bin/env node
import { Bootstrapper } from "./services/Bootstrapper";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { StateController } from "./controller/StateController";
import { ServiceLocator } from "./services/ServiceLocator";
import { CLIService } from "./services/CLIService";

Bootstrapper.Initiailze();

yargs(hideBin(process.argv))
  .command(
    "start [accounts]",
    "Starts the local hedera network.",
    (yargs: yargs.Argv<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).loadStartupOptions(yargs);
    },
    async (argv: yargs.ArgumentsCamelCase<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).setCurrentArgv(argv);
        await new StateController("start").startStateMachine();
    //   await NodeController.startLocalNode(argv);
    //   await main(
    //     argv.accounts,
    //     argv.async,
    //     argv.balance,
    //     argv.detached,
    //     argv.host
    //   );
    }
  )
  .command(
    "stop",
    "Stops the local hedera network and delete all the existing data.",
    async () => {
        await new StateController("stop").startStateMachine();
    //   await NodeController.stopLocalNode();
    }
  )
  .command(
    "restart [accounts]",
    "Restart the local hedera network.",
    (yargs: yargs.Argv<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).loadStartupOptions(yargs);
    },
    async (argv: yargs.ArgumentsCamelCase<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).setCurrentArgv(argv);
        await new StateController("restart").startStateMachine();
    //   await NodeController.stopLocalNode();
    //   await NodeController.startLocalNode(argv);
    //   await main(
    //     argv.accounts,
    //     argv.async,
    //     argv.balance,
    //     argv.detached,
    //     argv.host
    //   );
    }
  )
  .command(
    "generate-accounts [accounts]",
    "Generates the specified number of accounts [default: 10]",
    (yargs: yargs.Argv<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).loadAccountOptions(yargs);
    },
    async (argv: yargs.ArgumentsCamelCase<{}>) => {
        await new StateController("accountCreation").startStateMachine();
    //   await HederaUtils.prepareNode(
    //     argv.async,
    //     console,
    //     argv.balance,
    //     argv.accounts
    //   );
    //   process.exit();
    }
  )
  .command(
    "debug [timestamp]",
    "Parses and prints the contents of the record file that has been created during the selected timestamp.",
    (yargs: yargs.Argv<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).loadDebugOptions(yargs);
    },
    async (argv: yargs.ArgumentsCamelCase<{}>) => {
        ServiceLocator.Current.get<CLIService>(CLIService.name).setCurrentArgv(argv);
        await new StateController("debug").startStateMachine();
      //await HederaUtils.debug(console, argv.timestamp);
    }
  )
  .demandCommand()
  .strictCommands()
  .recommendCommands()
  .epilogue(
    `
Requirements:
  - Node.js >= v14.x
      Node version check: node -v
  - NPM >= v6.14.17
      NPM version check: npm -v
  - Docker >= v20.10.x
      Docker version check: docker -v
  - Docker Compose => v2.12.2
      Docker Compose version check: docker compose version

  * Ensure the gRPC FUSE for file sharing setting is disabled in the docker settings and VirtioFS is enabled
  * Ensure the following configurations are set at minimum in Docker Settings -> Resources and are available for use
      CPUs: 6
      Memory: 8GB
      Swap: 1 GB
      Disk Image Size: 64 GB`
  )
  .parse();