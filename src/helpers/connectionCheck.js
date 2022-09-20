const net = require("net");
var Docker = require('dockerode');

module.exports = class ConnectionCheck {
  static async checkDocker(){
    var socket = process.env.DOCKER_SOCKET || '/var/run/docker.sock';
    var isRunning = false;
    var docker = new Docker({ socketPath: socket });
    await docker.info().then((result) => {
      isRunning = true;
    }).catch((err) => {
      isRunning = false;
    });
    return isRunning
  }

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

  static checkConnection(port, host = '127.0.0.1') {
    return new Promise(function(resolve, reject) {
        const timeout = 3000;
        var timer = setTimeout(function() {
            reject("timeout");
            socket.end();
        }, timeout);
        var socket = net.createConnection(port, host, function() {
            clearTimeout(timer);
            resolve();
            socket.end();
        });
        socket.on('error', function(err) {
            clearTimeout(timer);
            reject(err);
        });
    });
  }
};
