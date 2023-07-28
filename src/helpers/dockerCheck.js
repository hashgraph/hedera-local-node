const Docker = require("dockerode");
const constants = require('./../utils/constants');
const shell = require("shelljs");

module.exports = class DockerCheck {

  static getDockerSocket() {
    const defaultSocketPath = constants.IS_WINDOWS ? '//./pipe/docker_engine' : '/var/run/docker.sock';
    return process.env.DOCKER_SOCKET || defaultSocketPath;
  }

  /**
   * Check if docker is running
   */
  static async checkDocker() {
    const socket = DockerCheck.getDockerSocket();
    let isRunning = false;

    const docker = new Docker({ socketPath: socket });
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

  /**
   * Return running container ID for given container name
   */
  static async getContainerId(name) {
    const socket = DockerCheck.getDockerSocket();
    const docker = new Docker({ socketPath: socket });

    const opts = {
      limit: 1,
      filters: { name: [`${name}`] },
    };

    return new Promise((resolve, reject) => {
      docker.listContainers(opts, function (err, containers) {
        if (err) {
          reject(err);
        } else {
          resolve(containers[0].Id);
        }
      });
    });
  }

  /**
   * Return running container version for given container name
   */
  static async getContainerVersion(name) {
    const socket = DockerCheck.getDockerSocket();
    const docker = new Docker({ socketPath: socket });

    const opts = {
      limit: 1,
      filters: { name: [`${name}`] },
    };

    return new Promise((resolve, reject) => {
      docker.listContainers(opts, function (err, containers) {
        if (err) {
          reject(err);
        } else {
          try {
            resolve(containers[0].Image.split(":")[1]);
          } catch (e) {
            resolve(constants.UNKNOWN_VERSION);
          }
        }
      });
    });
  }

  static async checkDockerComposeVersion() {
    console.log('Checking docker compose version...')
    const {code, stdout, stderr} = await shell.exec(`docker compose version -f json`, {silent:true});

    if (code != 0) {
        console.error(stderr)
        console.error('Seems like you are using docker compose v1, please upgrade to v2')
    } else {
      const output = JSON.parse(stdout);
      const version = output["version"].slice(0, 4);
  
      if (version === '2.9' || version === '2.10') {
          console.error("You are using docker compose v2.9 or v2.10, which is not recommended by docker. Please choose another version below 2.9 or above 2.10");
      }
    }
  }
};
