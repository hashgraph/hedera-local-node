const path = require("path");
const fs = require("fs");
const os = require("os");
const shell = require("shelljs");
const DockerCheck = require("../helpers/dockerCheck");
const constants = require("./constants");
const PREBUILT_CONFIGS = ["mainnet", "testnet", "previewnet", "local"];
const rootPath = process.cwd();

module.exports = class NodeController {
  static getNullOutput() {
    if (constants.IS_WINDOWS) return "null";
    return "/dev/null";
  }

  static async stopLocalNode() {
    const nullOutput = this.getNullOutput();
    console.log("Stopping the network...");
    shell.cd(__dirname);
    console.log("Stopping the docker containers...");
    shell.exec(`docker-compose kill 2>${nullOutput}`);
    shell.exec(`docker-compose down -v 2>${nullOutput}`);
    console.log("Cleaning the volumes and temp files...");
    shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
    shell.exec(`docker network prune -f 2>${nullOutput}`);
    shell.cd(rootPath);
  }

  static async startLocalNode(network, limits, devMode, fullMode) {
    await this.applyConfig(network, limits, devMode, fullMode);

    const dockerStatus = await DockerCheck.checkDocker();
    if (!dockerStatus) {
      console.log("Docker is not running.");
      process.exit(1);
    }
    const nullOutput = this.getNullOutput();

    console.log("Starting the docker containers...");
    shell.cd(__dirname);
    shell.cd("../../");
    const dockerComposeUpCmd = () => {
      return (fullMode)
          ? shell.exec(`docker-compose up -d 2>${nullOutput}`)
          : shell.exec(`docker-compose -f docker-compose.yml -f docker-compose.evm.yml up -d 2>${nullOutput}`);
    };
    const output = dockerComposeUpCmd();
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
      dockerComposeUpCmd();
    }
    shell.cd(rootPath);
  }

  static async applyConfig(network, limits, devMode, fullMode) {
    shell.cd(rootPath);
    shell.echo(`Applying ${network} config settings...`);
    const baseFolder = path.resolve(__dirname, "../../");
    let configRoot = PREBUILT_CONFIGS.includes(network) ? baseFolder : ".";

    let templatesPath = network == "local" ? `templates/local` : `templates`;
    const result = shell.exec(
      [
        `npx mustache ${configRoot}/configs/${network}.json ${baseFolder}/${templatesPath}/.env.template > ${baseFolder}/.env`,
        `npx mustache ${configRoot}/configs/${network}.json ${baseFolder}/templates/settings.txt > ${baseFolder}/compose-network/network-node/settings.txt`,
        `npx mustache ${configRoot}/configs/${network}.json ${baseFolder}/${templatesPath}/bootstrap.template.properties > ${baseFolder}/compose-network/network-node/data/config/bootstrap.properties`,
        `npx mustache ${configRoot}/configs/${network}.json ${baseFolder}/${templatesPath}/application.template.yml > ${baseFolder}/compose-network/mirror-node/application.yml`,
      ].join(" && ")
    );

    const relayRateLimitDisabled = !limits;
    if (relayRateLimitDisabled) {
      NodeController.setEnvValue(
        `${baseFolder}/.env`,
        "HBAR_RATE_LIMIT_TINYBAR",
        "0"
      );
      NodeController.setEnvValue(
        `${baseFolder}/.env`,
        "HBAR_RATE_LIMIT_DURATION",
        "0"
      );
    }
    NodeController.setEnvValue(
      `${baseFolder}/.env`,
      "RELAY_RATE_LIMIT_DISABLED",
      relayRateLimitDisabled
    );
    NodeController.setEnvValue(`${baseFolder}/.env`, "DEV_MODE", devMode);

    if (result.code !== 0) {
      shell.echo("Failed to apply config");
      shell.exit(result.code);
    } else {
      shell.echo(`Successfully applied ${network} config settings`);
    }

    if (!fullMode) {
      const yaml = require("js-yaml");
      const fs = require("fs");
      const application = yaml.load(fs.readFileSync(`${baseFolder}/compose-network/mirror-node/application.yml`));
      application.hedera.mirror.importer.dataPath = 'file:///node/';
      application.hedera.mirror.importer.downloader.sources = [{type: 'LOCAL'}];
      fs.writeFileSync(`${baseFolder}/compose-network/mirror-node/application.yml`, yaml.dump(application, {forceQuotes: true}));
    }
  }

  static setEnvValue(envPath, key, value) {
    const lines = fs.readFileSync(envPath, "utf8").split(os.EOL);
    const target = lines.indexOf(
      lines.find((line) => {
        return line.match(new RegExp(key));
      })
    );

    lines.splice(target, 1, `${key}=${value}`);
    fs.writeFileSync(envPath, lines.join(os.EOL));
  }
};
