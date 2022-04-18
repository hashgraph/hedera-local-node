const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');

module.exports = class PingerHelper {
  static run() {
    this.stop();
    const pingerProcess = childProcess.spawn('node', [path.resolve(__dirname, 'pinger.js')], {detached: true});

    fs.writeFileSync(path.resolve(__dirname, '../.pid'), pingerProcess.pid + '');
  }

  static stop() {
    const pidFilePath = path.resolve(__dirname, '../.pid');
    if (fs.existsSync(pidFilePath)) {
      try {
        process.kill(fs.readFileSync(pidFilePath));
        fs.unlinkSync(pidFilePath);
      } catch (e) {
        // the process doesn't exist
      }
    }
  }
}
