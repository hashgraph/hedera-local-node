const net = require('net');

module.exports = class CliHelper {
  static getArgValue(args, needle, defaultValue = null) {
    const item = args.find(arg => arg.indexOf('--' + needle) > -1);
    if (!item) {
      return defaultValue;
    }

    const chunks = item.split('=');
    return chunks.length > 1 ? chunks[1].trim() : defaultValue;
  }

  static async waitForFiringUp(port) {
    let isReady = false;
    while (!isReady) {
      net.createConnection(port).on('data', function () {
        isReady = true;
      }).on('error', (err) => {
        console.log(err);
        console.log('Retrying in 5 seconds...');
      });

      await new Promise(r => setTimeout(r, 5000));
    }
  }
}
