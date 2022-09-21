const net = require("net");

module.exports = class ConnectionCheck {

  /**
   * Check if containers are up and running
   */
  static async waitForFiringUp(port, logger, host = "127.0.0.1") {
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

  /**
   * Check connection to given host and port
   */
  static checkConnection(port, host = "127.0.0.1") {
    return new Promise(function (resolve, reject) {
      const timeout = 3000;
      let timer = setTimeout(function () {
        reject("timeout");
        socket.end();
      }, timeout);
      let socket = net.createConnection(port, host, function () {
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
