#!/usr/bin/env node

// SPDX-License-Identifier: Apache-2.0

import { Bootstrapper } from "./services/Bootstrapper";
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { StateController } from "./controller/StateController";
import { CLIService } from "./services/CLIService";

/**
 * This script is the entry point for the Hedera Local Node CLI.
 * It provides several commands to manage the local Hedera network.
 */
yargs(hideBin(process.argv))
    .command(
        "start [accounts]",
        "Starts the local hedera network.",
        (yargs: yargs.Argv<{}>) => {
            CLIService.loadStartupOptions(yargs);
        },
        async () => await new StateController("start").startStateMachine()
    )
    .command(
        "stop",
        "Stops the local hedera network and delete all the existing data.",
        (yargs: yargs.Argv<{}>) => {
            CLIService.loadStopOptions(yargs);
        },
        async () => await new StateController("stop").startStateMachine()
    )
    .command(
        "restart [accounts]",
        "Restart the local hedera network.",
        (yargs: yargs.Argv<{}>) => {
            CLIService.loadStartupOptions(yargs);
        },
        async () => await new StateController("restart").startStateMachine()
    )
    .command(
        "generate-accounts [accounts]",
        "Generates the specified number of accounts [default: 10]",
        (yargs: yargs.Argv<{}>) => {
            CLIService.loadAccountOptions(yargs);
        },
        async () => await new StateController("accountCreation").startStateMachine()
    )
    .middleware(Bootstrapper.initialize)
    .demandCommand()
    .strictCommands()
    .recommendCommands()
    .epilogue(
    `
    Requirements:
    - Node.js >= v20.11.0
        Node version check: node -v
    - NPM >= v10.2.4
        NPM version check: npm -v
    - Docker >= v27.3.1
        Docker version check: docker -v
    - Docker Compose => v2.29.7
        Docker Compose version check: docker compose version
    * Ensure the gRPC FUSE for file sharing setting is disabled in the docker settings and VirtioFS is enabled
    * Ensure the following configurations are set at minimum in Docker Settings -> Resources and are available for use
        CPUs: 6
        Memory: 8 GB
        Swap: 1 GB
        Disk Image Size: 64 GB`
  )
  .parse();
