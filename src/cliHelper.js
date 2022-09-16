const net = require('net');
const shell = require('shelljs');

module.exports = class CliHelper {
  static async waitForFiringUp(port, host = '127.0.0.1') {
    let isReady = false;
    while (!isReady) {
      net
        .createConnection(port, host)
        .on('data', function () {
          isReady = true;
        })
        .on('error', (err) => {
          console.log(`Waiting for the containers at ${host}:${port}, retrying in 20 seconds...`);
          console.debug(err);
        });

      await new Promise((r) => setTimeout(r, 20000));
    }
  }

  static async applyNetworkConfig(network) {
    shell.echo(`Applying ${network} config settings...`)
    const result = shell.exec(
      [
        `npx mustache configs/${network}.json configs/docker-compose.template.yml > docker-compose.yml`,
        `npx mustache configs/${network}.json configs/bootstrap.template.properties > ./compose-network/network-node/data/config/bootstrap.properties`,
        `npx mustache configs/${network}.json configs/application.template.yml > ./compose-network/mirror-node/application.yml`
      ].join(" && ")
    )

    if(result.code !== 0) {
      shell.echo('Failed to apply config')
      shell.exit(result.code)
    } else {
      shell.echo(`Successfully applied ${network} config settings`)
    }
  }
};
