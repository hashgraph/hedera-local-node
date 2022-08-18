#!/usr/bin/env node
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const shell = require('shelljs');
const CliHelper = require('./src/cliHelper');
const HederaUtils = require('./src/hederaUtils');

yargs(hideBin(process.argv))
    .command('start [accounts]', 'Starts the local hedera network.', (_yargs) => {
      return _yargs.positional('accounts', {
        describe: 'Generated accounts of each type.',
        default: 10
      }).options('detached', {
        alias: 'd',
        type: 'boolean',
        describe: 'Run the local node in detached mode',
        demandOption: false
      })
    }, async (argv) => {
      await start(argv.accounts, argv.detached);
    })
    .command('stop', 'Stops the local hedera network and delete all the existing data.', async () => {
      await stop();
    })
    .command('restart', 'Restart the local hedera network.', (_yargs) => {
      return _yargs.positional('accounts', {
        describe: 'Generated accounts of each type.',
        default: 10
      }).options('detached', {
        alias: 'd',
        type: 'boolean',
        describe: 'Run the local node in detached mode',
        demandOption: false
      });
    }, async (argv) => {
      await stop();
      await start(argv.accounts, argv.detached);
    })
    .command('generate-accounts [n]', 'Generates N accounts, default 10.', (_yargs) => {
      return _yargs.positional('n', {
        describe: 'Generated accounts of each type.',
        default: 10
      });
    }, async (argv) => {
      await HederaUtils.generateAccounts(argv.n);
    })
    .command('*', '', () => {
      console.log(`
Local Hedera Plugin - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
      options:
        --d or --detached for starting in detached mode.
    stop - Stops the local hedera network and delete all the existing data.
    restart - Restart the local hedera network.
    generate-accounts <n> - Generates N accounts, default 10.
  `);
    })
    .parse();

async function start(n, d) {
  console.log('Starting the docker containers...');
  shell.cd(__dirname);
  const output = shell.exec('docker-compose up -d 2>/dev/null');
  if (output.code == 1) {
    const yaml = require('js-yaml');
    const fs = require('fs');
    const containersNames = Object.values(yaml.load(fs.readFileSync('docker-compose.yml')).services)
        .map(e => e.container_name)
        .join(' ');
    shell.exec(`docker stop ${containersNames} 2>/dev/null 1>&2`);
    shell.exec(`docker rm -f -v ${containersNames} 2>/dev/null 1>&2`);
    await stop();
    shell.exec('docker-compose up -d 2>/dev/null');
  }
  await CliHelper.waitForFiringUp(5600);
  console.log('Starting the network...');
  console.log('Generating accounts...');
  await HederaUtils.generateAccounts(n, true);

  if (d) {
    console.log('\nLocal node has been successfully started in detached mode.');
    process.exit();
  }

  console.log('\nLocal node has been successfully started. Press Ctrl+C to stop the node.');
  // should be replace with the output of network-node
  // once https://github.com/hashgraph/hedera-services/issues/3749 is implemented
  let i = 0;
  while (i++ < Number.MAX_VALUE) await new Promise(resolve => setTimeout(resolve, 10000));
}

async function stop() {
  console.log('Stopping the network...');
  shell.cd(__dirname);
  console.log('Stopping the docker containers...');
  shell.exec('docker-compose down -v 2>/dev/null');
  console.log('Cleaning the volumes and temp files...');
  shell.exec('rm -rf network-logs/* >/dev/null 2>&1');
  shell.exec('docker network prune -f 2>/dev/null');
}

process.on('SIGINT', async () => {
  await stop();
  process.exit(0);
});
