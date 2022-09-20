const net = require("net");

module.exports = class ConnectionCheck {
  static async waitForFiringUp(port, host = "127.0.0.1", logger) {
    let isReady = false;
    while (!isReady) {
      net
        .createConnection(port, host)
        .on("data", function () {
          isReady = true;
        })
        .on("error", (err) => {
          logger.log(
            `Waiting for the containers at ${host}:${port}, retrying in 20 seconds...`
          );
          logger.log(err);
        });

      await new Promise((r) => setTimeout(r, 20000));
    }
  }

  static checkConnection(port, host = "127.0.0.1") {
    return new Promise(function (resolve, reject) {
      const timeout = 3000;
      var timer = setTimeout(function () {
        reject("timeout");
        socket.end();
      }, timeout);
      var socket = net.createConnection(port, host, function () {
        clearTimeout(timer);
        resolve();
        socket.end();
      });
      socket.on("error", function (err) {
        clearTimeout(timer);
        reject(err);
      });
    });
  }
};
