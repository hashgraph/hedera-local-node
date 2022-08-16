#!/usr/bin/env node
const [, , ...commands] = process.argv;
const shell = require('shelljs');
const CliHelper = require('./src/cliHelper');
const HederaUtils = require('./src/hederaUtils');

(async function () {
  if (!commands.length) {
    console.log(`
Local Hedera Plugin - Runs consensus and mirror nodes on localhost:
- consensus node url - 127.0.0.1:50211
- node id - 0.0.3
- mirror node url - http://127.0.0.1:5551

Available commands:
    start - Starts the local hedera network.
    stop - Stops the local hedera network and delete all the existing data.
    restart - Restart the local hedera network.
    generate-accounts <n> - Generates N accounts, default 10.
  `);

    process.exit();
  }

  switch (commands[0]) {
    case 'start': {
      await start(commands);
      break;
    }
    case 'stop': {
      await stop(commands);
      break;
    }
    case 'restart': {
      await stop(commands);
      await start(commands);
      break;
    }
    case 'generate-accounts': {
      await HederaUtils.generateAccounts(commands[1] || 10);
      break;
    }
    default: {
      console.log(`Undefined command. Check available commands at "npx hedera-local"`);
    }
  }

  function getNullOutput() {
    if (process.platform === 'win32') return 'nul';
    return '/dev/null';
  }

  async function start(commands) {
    const nullOutput = getNullOutput();

    console.log('Starting the docker containers...');
    shell.cd(__dirname);
    const output = shell.exec(`docker-compose up -d 2>${nullOutput}`);
    if (output.code == 1) {
      const yaml = require('js-yaml');
      const fs = require('fs');
      const containersNames = Object.values(yaml.load(fs.readFileSync('docker-compose.yml')).services)
          .map(e => e.container_name)
          .join(' ');
      shell.exec(`docker stop ${containersNames} 2>${nullOutput} 1>&2`);
      shell.exec(`docker rm -f -v ${containersNames} 2>${nullOutput} 1>&2`);
      await stop();
      shell.exec(`docker-compose up -d 2>${nullOutput}`);
    }
    await CliHelper.waitForFiringUp(5600);
    console.log('Starting the network...');
    console.log('Generating accounts...');
    await HederaUtils.generateAccounts(CliHelper.getArgValue(commands, 'accounts', 10), true);
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

  process.exit();
})();