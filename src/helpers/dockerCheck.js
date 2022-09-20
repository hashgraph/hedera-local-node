var Docker = require("dockerode");

module.exports = class DockerCheck {
  static async checkDocker() {
    var socket = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    var isRunning = false;

    var docker = new Docker({ socketPath: socket });
    await docker
      .info()
      .then((result) => {
        isRunning = true;
      })
      .catch((err) => {
        isRunning = false;
      });
    return isRunning;
  }

  static async getContainerVersion(name) {
    var socket = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
    var docker = new Docker({ socketPath: socket });

    var opts = {
      limit: 1,
      filters: { name: [`${name}`] },
    };

    return new Promise((resolve, reject) => {
      docker.listContainers(opts, function (err, containers) {
        if (err) {
          reject(err);
        } else {
          resolve(containers[0].Image.split(":")[1]);
        }
      });
    });
  }
};
