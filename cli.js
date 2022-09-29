#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const ConnectionCheck = require("./src/helpers/connectionCheck");
const HederaUtils = require("./src/utils/hederaUtils");
const TerminalUserInterface = require("./src/tui");
const NodeController = require("./src/utils/nodeController");
const Docker = require("dockerode");
const stream = require('stream');
const constants = require('./src/utils/constants');
const DockerCheck = require("./src/helpers/dockerCheck");
const CliOptions = require('./src/utils/cliOptions');

yargs(hideBin(process.argv))
  .command(
    "start [accounts]",
    "Starts the local hedera network.",
    (_yargs) => {
      CliOptions.addAccountsOption(_yargs);
      CliOptions.addDetachedOption(_yargs);
      CliOptions.addHostOption(_yargs);
      CliOptions.addNetworkOption(_yargs);
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
      CliOptions.addAccountsOption(_yargs);
      CliOptions.addDetachedOption(_yargs);
      CliOptions.addHostOption(_yargs);
      CliOptions.addNetworkOption(_yargs);
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
      CliOptions.addAccountsOption(_yargs);
    },
    async (argv) => {
      await HederaUtils.generateAccounts(console, argv.n);
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
  .demandCommand()
  .strictCommands()
  .recommendCommands()
  .parse();

async function main(accounts, detached, host) {
  if (detached) {
    await startDetached(accounts, host);
  }

  const screen = new TerminalUserInterface();
  const eventLogger = screen.getConsensusLog();
  const accountLogger = screen.getAccountBoard();
  const relayLogger = screen.getRelayLog();
  const mirrorNodeLogger = screen.getMirrorNodeLog();

  await screen.updateStatusBoard(h);
  await start(accounts, host, eventLogger, accountLogger);

  eventLogger.log(
    "\nLocal node has been successfully started. Press Ctrl+C to stop the node."
  );

  const consensusNodeId = await DockerCheck.getCointainerId(constants.CONSENSUS_NODE_LABEL);
  const mirrorNodeId = await DockerCheck.getCointainerId(constants.MIRROR_NODE_LABEL);
  const relayId = await DockerCheck.getCointainerId(constants.RELAY_LABEL);

  attachContainerLogs(consensusNodeId,eventLogger);
  attachContainerLogs(relayId,relayLogger);
  attachContainerLogs(mirrorNodeId,mirrorNodeLogger);

  let i = 0;
  while (i++ < Number.MAX_VALUE) {
    await screen.updateStatusBoard(h);
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}

/**
 * Attach container logs to given screen logger
 */
function attachContainerLogs(containerId, logger) {
  const docker = new Docker({
    socketPath: '/var/run/docker.sock'
  });
  const container = docker.getContainer(containerId)

  let logStream = new stream.PassThrough();
  logStream.on('data', function(chunk){
    let line = chunk.toString('utf8');
    if (!line.includes(' Transaction ID: 0.0.2-')){
      logger.log(line);
    }
  });

  container.logs({
    follow: true,
    stdout: true,
    stderr: true,
    since: Date.now() / 1000
  }, function(err, stream){
    if(err) {
      return console.error(err.message);
    }
    container.modem.demuxStream(stream, logStream, logStream);
    stream.on('end', function(){
      logStream.end('!stop!');
    });
  });
}

/**
 * Check if network is up and generate accounts
 */
async function start(accounts, host, eventLogger, accountLogger) {
  eventLogger.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, eventLogger, host);
  eventLogger.log("Starting the network...");

  accountLogger.log("Generating accounts...");
  await HederaUtils.generateAccounts(accountLogger, accounts, true, host);
}


/**
 * Check if network is up and generate accounts
 */
async function startDetached(accounts, host) {
  console.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, console, host);
  console.log("Starting the network...");
  console.log("Generating accounts...");
  await HederaUtils.generateAccounts(console, accounts, true, host);
  console.log("\nLocal node has been successfully started in detached mode.");
  process.exit();
}
