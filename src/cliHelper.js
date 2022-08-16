const net = require('net');

module.exports = class CliHelper {
  static async waitForFiringUp(port) {
    let isReady = false;
    while (!isReady) {
      net.createConnection(port).on('data', function () {
        isReady = true;
      }).on('error', (err) => {
        console.log('Waiting the containers, retrying in 20 seconds...');
      });

      await new Promise(r => setTimeout(r, 20000));
    }
  }
}
