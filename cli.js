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
  .parse();

async function main(n, d, h) {
  if (d) {
    await startDetached(n, h);
  }

  const screen = new TerminalUserInterface();
  const eventLogger = screen.getConsensusLog();
  const accountLogger = screen.getAccountBoard();
  const relayLogger = screen.getRelayLog();
  const mirrorNodeLogger = screen.getMirrorNodeLog();

  await screen.updateStatusBoard(h);
  await start(n, h, eventLogger, accountLogger);

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
    since: Date.now()/1000
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
async function start(n, h, eventLogger, accountLogger) {
  eventLogger.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, eventLogger, h);
  eventLogger.log("Starting the network...");
  
  accountLogger.log("Generating accounts...");
  await HederaUtils.generateAccounts(accountLogger, n, true, h);
}


/**
 * Check if network is up and generate accounts
 */
async function startDetached(n, h) {
  console.log("Detecting the network...");
  await ConnectionCheck.waitForFiringUp(5600, console, h);
  console.log("Starting the network...");
  console.log("Generating accounts...");
  await HederaUtils.generateAccounts(console, n, true, h);
  console.log("\nLocal node has been successfully started in detached mode.");
  process.exit();
}
