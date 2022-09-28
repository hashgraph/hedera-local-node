const shell = require("shelljs");
const DockerCheck = require("../helpers/dockerCheck");

module.exports = class NodeController {
  static getNullOutput() {
    if (process.platform === "win32") return "nul";
    return "/dev/null";
  }

  static async stopLocalNode() {
    const nullOutput = this.getNullOutput();
    console.log("Stopping the network...");
    shell.cd(__dirname);
    console.log("Stopping the docker containers...");
    shell.exec(`docker-compose down -v 2>${nullOutput}`);
    console.log("Cleaning the volumes and temp files...");
    shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
    shell.exec(`docker network prune -f 2>${nullOutput}`);
  }

  static async startLocalNode() {
    const dockerStatus = await DockerCheck.checkDocker();
    if (!dockerStatus) {
      console.log("Docker is not running.");
      process.exit();
    }
    const nullOutput = this.getNullOutput();

    console.log("Starting the docker containers...");
    shell.cd(__dirname);
    shell.cd("../../");
    const output = shell.exec(`docker-compose up -d 2>${nullOutput}`);
    if (output.code == 1) {
      const yaml = require("js-yaml");
      const fs = require("fs");
      const containersNames = Object.values(
        yaml.load(fs.readFileSync("docker-compose.yml")).services
      )
        .map((e) => e.container_name)
        .join(" ");
      shell.exec(`docker stop ${containersNames} 2>${nullOutput} 1>&2`);
      shell.exec(`docker rm -f -v ${containersNames} 2>${nullOutput} 1>&2`);
      await this.stopLocalNode();
      shell.exec(`docker-compose up -d 2>${nullOutput}`);
    }
  }
};
