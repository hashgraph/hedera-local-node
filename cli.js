#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const ConnectionCheck = require("./src/helpers/connectionCheck");
const HederaUtils = require("./src/utils/hederaUtils");
const TerminalUserInterface = require("./src/tui");
const NodeController = require("./src/utils/nodeController");
const Docker = require("dockerode");
const stream = require("stream");
const constants = require("./src/utils/constants");
const DockerCheck = require("./src/helpers/dockerCheck");
const CliOptions = require("./src/utils/cliOptions");

yargs(hideBin(process.argv))
  .command(
    "start [accounts]",
    "Starts the local hedera network.",
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
      CliOptions.addDetachedOption(yargs);
      CliOptions.addHostOption(yargs);
      CliOptions.addNetworkOption(yargs);
      CliOptions.addRateLimitOption(yargs);
      CliOptions.addDevModeOption(yargs);
      CliOptions.addFullModeOption(yargs);
      CliOptions.addBalanceOption(yargs);
      CliOptions.addAsyncOption(yargs);
      CliOptions.addMultiNodeOption(yargs);
    },
    async (argv) => {
      await NodeController.startLocalNode(argv.network, argv.limits, argv.dev, argv.full, argv.multinode, argv.host);
      await main(argv.accounts, argv.async, argv.balance, argv.detached, argv.host);
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
    "restart [accounts]",
    "Restart the local hedera network.",
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
      CliOptions.addDetachedOption(yargs);
      CliOptions.addHostOption(yargs);
      CliOptions.addNetworkOption(yargs);
      CliOptions.addRateLimitOption(yargs);
      CliOptions.addDevModeOption(yargs);
      CliOptions.addFullModeOption(yargs);
      CliOptions.addBalanceOption(yargs);
      CliOptions.addAsyncOption(yargs);
      CliOptions.addMultiNodeOption(yargs);
    },
    async (argv) => {
      await NodeController.stopLocalNode();
      await NodeController.startLocalNode(argv.network, argv.limits, argv.dev, argv.full, argv.multinode, argv.host);
      await main(argv.accounts, argv.async, argv.balance, argv.detached, argv.host);
    }
  )
  .command(
    "generate-accounts [accounts]",
    "Generates the specified number of accounts [default: 10]",
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
      CliOptions.addBalanceOption(yargs);
      CliOptions.addAsyncOption(yargs);
    },
    async (argv) => {
      await HederaUtils.prepareNode(argv.async, console, argv.balance, argv.accounts);
      process.exit();
    }
  )
  .command(
    "debug [timestamp]",
    "Parses and prints the contents of the record file that has been created during the selected timestamp.",
    (yargs) => {
      CliOptions.addTimestampOption(yargs);
    },
    async (argv) => {
      await HederaUtils.debug(console, argv.timestamp);
    }
  )
  .demandCommand()
  .strictCommands()
  .recommendCommands()
  .epilogue(`
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
      Disk Image Size: 64 GB`)
  .parse();

async function main(accounts, async, balance, detached, host) {
  if (detached) {
    await startDetached(accounts, async, balance, host);
  }

  const screen = new TerminalUserInterface();
  const eventLogger = screen.getConsensusLog();
  const accountLogger = screen.getAccountBoard();
  const relayLogger = screen.getRelayLog();
  const mirrorNodeLogger = screen.getMirrorNodeLog();

  await screen.updateStatusBoard(host);
  await start(accounts, async, balance, host, eventLogger, accountLogger);

  eventLogger.log(
    "\nLocal node has been successfully started. Press Ctrl+C to stop the node."
  );

  const consensusNodeId = await DockerCheck.getContainerId(
    constants.CONSENSUS_NODE_LABEL
  );
  const mirrorNodeId = await DockerCheck.getContainerId(
    constants.MIRROR_NODE_LABEL
  );
  const relayId = await DockerCheck.getContainerId(constants.RELAY_LABEL);

  attachContainerLogs(consensusNodeId, eventLogger);
  attachContainerLogs(relayId, relayLogger);
  attachContainerLogs(mirrorNodeId, mirrorNodeLogger);

  let i = 0;
  while (i++ < Number.MAX_VALUE) {
    await screen.updateStatusBoard(host);
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

/**
 * Attach container logs to given screen logger
 */
function attachContainerLogs(containerId, logger) {
  const socket = DockerCheck.getDockerSocket();
  const docker = new Docker({
    socketPath: socket,
  });
  const container = docker.getContainer(containerId);

  let logStream = new stream.PassThrough();
  logStream.on("data", function (chunk) {
    let line = chunk.toString("utf8");
    if (!line.includes(" Transaction ID: 0.0.2-")) {
      logger.log(line);
    }
  });

  container.logs(
    {
      follow: true,
      stdout: true,
      stderr: true,
      since: Date.now() / 1000,
    },
    function (err, stream) {
      if (err) {
        return console.error(err.message);
      }
      container.modem.demuxStream(stream, logStream, logStream);
      stream.on("end", function () {
        logStream.end("!stop!");
      });
    }
  );
}

/**
 * Check if network is up and generate accounts
 */
async function start(accounts, async, balance, host, eventLogger, accountLogger) {
  eventLogger.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, eventLogger, host);
  await ConnectionCheck.waitForFiringUp(50211, console, host);
  eventLogger.log("Starting the network...");

  eventLogger.log("Preparing Node...");
  await HederaUtils.prepareNode(async, accountLogger, async, balance, accounts, true, host);
}

/**
 * Check if network is up and generate accounts
 */
async function startDetached(accounts, async, balance, host) {
  console.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, console, host);
  await ConnectionCheck.waitForFiringUp(50211, console, host);
  console.log("Starting the network...");

  console.log("Preparing Node...");
  await HederaUtils.prepareNode(async, console, balance, accounts, true, host);
  console.log("\nLocal node has been successfully started in detached mode.");
  process.exit();
}
