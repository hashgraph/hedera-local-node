#!/usr/bin/env node
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const ConnectionCheck = require("./src/helpers/connectionCheck");
const HederaUtils = require("./src/utils/hederaUtils");
const TerminalUserInterface = require("./src/tui");
const NodeController = require("./src/utils/nodeController");
var Docker = require("dockerode");
var stream = require('stream');
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
  relayLogger = screen.getRelayLog();

  await screen.updateStatusBoard();
  await start(n, h, eventLogger, accountLogger);

  eventLogger.log(
    "\nLocal node has been successfully started. Press Ctrl+C to stop the node."
  );
  // should be replace with the output of network-node
  // once https://github.com/hashgraph/hedera-services/issues/3749 is implemented
  // let i = 0;
  // while (i++ < Number.MAX_VALUE) {
  //   // eventLogger.log(await ConnectionCheck.containerStatusCheck(5600,'127.0.0.1', eventLogger));
  //   await screen.updateStatusBoard();
  //   containerLogs('c4e693115df66438cb4e7b965da37760850730358057ac4f7da6a0d03d44b1b0', eventLogger)
  //   // await new Promise((resolve) => setTimeout(resolve, 10000));
  // }
  containerLogs('4793d272334e802d96776de8c52b7bd74a2425775d1daf8d07bfcb623856587a',eventLogger);
  containerLogs('4793d272334e802d96776de8c52b7bd74a2425775d1daf8d07bfcb623856587a',relayLogger);
  // Promise.all([,]);
  // Promise.allSettled(tasks).then((result)=> {
  //   console.log(result);
  // })
  // .catch((err) => {
  //   console.log(err);
  // })
}

/**
 * Get logs from running container
 */
function containerLogs(containerId,consensusLogger) {
    var docker = new Docker({
      socketPath: '/var/run/docker.sock'
    });
    const container = docker.getContainer(containerId)  
    
    var logStream = new stream.PassThrough();
    logStream.on('data', function(chunk){
      consensusLogger.log(chunk.toString('utf8'));
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
  
      // setTimeout(function() {
      //   stream.destroy();
      // }, 2000);
    });
  
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
