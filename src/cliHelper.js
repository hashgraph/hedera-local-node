const net = require('net');

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
};
