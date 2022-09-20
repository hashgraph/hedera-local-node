#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const ConnectionCheck = require("./src/helpers/connectionCheck");
const HederaUtils = require("./src/utils/hederaUtils");
const TerminalUserInterface = require("./src/tui");
const NodeController = require("./src/utils/nodeController");
let screen;
let eventLogger;
let accountLogger;
yargs(hideBin(process.argv))
  .command(
    "start [accounts]",
    "Starts the local hedera network.",
    (_yargs) => {
      return _yargs
        .positional("accounts", {
          describe: "Generated accounts of each type.",
          default: 10,
        })
        .options({
          detached: {
            alias: "d",
            type: "boolean",
            describe: "Run the local node in detached mode",
            demandOption: false,
          },
          host: {
            alias: "h",
            type: "string",
            describe: "Run the local node with host",
            demandOption: false,
            default: "127.0.0.1",
          },
        });
    },
    async (argv) => {
      await NodeController.startLocalNode();
      await main(argv.accounts, argv.detached, argv.host);
    }
  )
  .command(
    "stop",
    "Stops the local hedera network and delete all the existing data.",
    async () => {
      await NodeController.stopLocalNode();
    }
  )
  .command(
    "restart",
    "Restart the local hedera network.",
    (_yargs) => {
      return _yargs
        .positional("accounts", {
          describe: "Generated accounts of each type.",
          default: 10,
        })
        .options({
          detached: {
            alias: "d",
            type: "boolean",
            describe: "Run the local node in detached mode",
            demandOption: false,
          },
          host: {
            alias: "h",
            type: "string",
            describe: "Run the local node with host",
            demandOption: false,
            default: "127.0.0.1",
          },
        });
    },
    async (argv) => {
      await NodeController.stopLocalNode();
      await NodeController.startLocalNode();
      await main(argv.accounts, argv.detached, argv.host);
    }
  )
  .command(
    "generate-accounts [n]",
    "Generates N accounts, default 10.",
    (_yargs) => {
      return _yargs.positional("n", {
        describe: "Generated accounts of each type.",
        default: 10,
      });
    },
    async (argv) => {
      await HederaUtils.generateAccounts(argv.n, console);
    }
  )
  .command("*", "", () => {
    console.log(`
Local Hedera Plugin - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
      options:
        --d or --detached for starting in detached mode.
        --h or --host to override the default host.
    stop - Stops the local hedera network and delete all the existing data.
    restart - Restart the local hedera network.
    generate-accounts <n> - Generates N accounts, default 10.
      options:
        --h or --host to override the default host.
  `);
  })
  .parse();

async function main(n, d, h) {
  if (d) {
    await startDetached(n, h);
  }

  screen = new TerminalUserInterface();
  eventLogger = screen.getConsensusLog();
  accountLogger = screen.getAccountBoard();
  await screen.updateStatusBoard();
  await start(n, h, eventLogger, accountLogger);

  eventLogger.log(
    "\nLocal node has been successfully started. Press Ctrl+C to stop the node."
  );
  // should be replace with the output of network-node
  // once https://github.com/hashgraph/hedera-services/issues/3749 is implemented
  let i = 0;
  while (i++ < Number.MAX_VALUE) {
    // eventLogger.log(await ConnectionCheck.containerStatusCheck(5600,'127.0.0.1', eventLogger));
    await screen.updateStatusBoard();
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

async function start(n, h, eventLogger, accountLogger) {
  eventLogger.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, h, eventLogger);
  eventLogger.log("Starting the network...");
  accountLogger.log("Generating accounts...");
  await HederaUtils.generateAccounts(n, accountLogger, true, h);
}

async function startDetached(n, h) {
  console.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, h, console);
  console.log("Starting the network...");
  console.log("Generating accounts...");
  await HederaUtils.generateAccounts(n, console, true, h);
  console.log("\nLocal node has been successfully started in detached mode.");
  process.exit();
}
