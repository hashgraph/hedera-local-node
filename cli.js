#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const shell = require('shelljs');
const CliHelper = require('./src/cliHelper');
const HederaUtils = require('./src/hederaUtils');
const CliOptions = require('./src/CliOptions')

function getNullOutput() {
  if (process.platform === 'win32') return 'nul';
  return '/dev/null';
}

yargs(hideBin(process.argv))
  .command(
    'start [accounts]',
    'Starts the local hedera network.',
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
      CliOptions.addDetachedOption(yargs);
      CliOptions.addHostOption(yargs);
      CliOptions.addNetworkOption(yargs);
    },
    async (argv) => {
      await start(argv.accounts, argv.detached, argv.host, argv.network);
    }
  )
  .command(
    'stop',
    'Stops the local hedera network and delete all the existing data.',
    (yargs) => {
      // This is needed otherwise running `stop --help` will execute the command
      return yargs;
    },
    async () => {
      await stop();
    }
  ).command(
    'restart [accounts]',
    'Restart the local hedera network.',
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
      CliOptions.addDetachedOption(yargs);
      CliOptions.addHostOption(yargs);
      CliOptions.addNetworkOption(yargs);
    },
    async (argv) => {
      await stop();
      await start(argv.accounts, argv.detached, argv.host, argv.network);
    }
  )
  .command(
    'generate-accounts [accounts]',
    'Generates N accounts, default 10.',
    (yargs) => {
      CliOptions.addAccountsOption(yargs);
    },
    async (argv) => {
      await HederaUtils.generateAccounts(argv.accounts);
    }
  )
  .positional('accounts', {
    describe: 'Generated accounts of each type.',
    default: 10,
  })
  .demandCommand()
  .strictCommands()
  .recommendCommands()
  .parse();

async function start(accounts, detached, host, network) {
  const nullOutput = getNullOutput();
  await CliHelper.applyNetworkConfig(network);

  console.log('Starting the docker containers...');
  shell.cd(__dirname);
  const output = shell.exec(`docker-compose up -d 2>${nullOutput}`);
  if (output.code == 1) {
    const yaml = require('js-yaml');
    const fs = require('fs');
    const containersNames = Object.values(yaml.load(fs.readFileSync('docker-compose.yml')).services)
      .map((e) => e.container_name)
      .join(' ');
    shell.exec(`docker stop ${containersNames} 2>${nullOutput} 1>&2`);
    shell.exec(`docker rm -f -v ${containersNames} 2>${nullOutput} 1>&2`);
    await stop();

    shell.exec(`docker-compose up -d 2>${nullOutput}`);
  }
  await CliHelper.waitForFiringUp(5600, host);
  console.log('Starting the network...');
  console.log('Generating accounts...');
  await HederaUtils.generateAccounts(accounts, true, host);

  if (detached) {
    console.log('\nLocal node has been successfully started in detached mode.');
    process.exit();
  }

  console.log('\nLocal node has been successfully started. Press Ctrl+C to stop the node.');
  // should be replace with the output of network-node
  // once https://github.com/hashgraph/hedera-services/issues/3749 is implemented
  let i = 0;
  while (i++ < Number.MAX_VALUE) await new Promise((resolve) => setTimeout(resolve, 10000));
}

async function stop() {
  const nullOutput = getNullOutput();

  console.log('Stopping the network...');
  shell.cd(__dirname);
  console.log('Stopping the docker containers...');
  shell.exec(`docker-compose down -v 2>${nullOutput}`);
  console.log('Cleaning the volumes and temp files...');
  shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
  shell.exec(`docker network prune -f 2>${nullOutput}`);
}

process.on('SIGINT', async () => {
  await stop();
  process.exit(0);
});
