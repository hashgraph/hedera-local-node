const path = require("path");
const yargs = require("yargs");
const fs = require("fs");
const os = require("os");
const shell = require("shelljs");
const DockerCheck = require("../helpers/dockerCheck");
const constants = require("./constants");
const yaml = require("js-yaml");
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
    shell.cd("../../");
    console.log("Stopping the docker containers...");
    shell.exec(`docker compose kill --remove-orphans 2>${nullOutput}`);
    shell.exec(`docker compose down -v --remove-orphans 2>${nullOutput}`);
    console.log("Cleaning the volumes and temp files...");
    shell.exec(`rm -rf network-logs/* >${nullOutput} 2>&1`);
    shell.exec(`docker network prune -f 2>${nullOutput}`);
    shell.cd(rootPath);
  }

  /**
   * Checks the nessecery arguments and start the local node
   * @param {yargs.ArgumentsCamelCase<{}>} argv
   */
  static async startLocalNode(argv) {
    const { network, limits, dev: devMode, full: fullMode, multinode: multiNode, host, usercompose: userCompose, composedir: composeDir } = argv;
    await this.applyConfig(network, limits, devMode, fullMode, multiNode, host);

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
      const composeFiles = ['docker-compose.yml'];
      if (!fullMode) {
        composeFiles.push('docker-compose.evm.yml');
      }
      if (multiNode) {
        composeFiles.push('docker-compose.multinode.yml');
        if (!fullMode) {
          composeFiles.push('docker-compose.multinode.evm.yml');
        }
      }
      if (userCompose) {
        composeFiles.push(...this.getUserComposeFiles(composeDir));
      }
      return shell.exec(`docker compose -f ${composeFiles.join(' -f ')} up -d 2>${nullOutput}`);
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

  static async applyConfig(network, limits, devMode, fullMode, multiNode, host) {
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

    // Network node versions before and after 0.40.0 require different formats of the config.txt file
    const isPost40 = await NodeController.isNetworkNodePost40();

    if (isPost40) {
      await fs.copyFileSync(
          path.resolve(__dirname, `${configRoot}/configs/post-0.40-config.txt`),
          path.resolve(__dirname, `${baseFolder}/compose-network/network-node/config.txt`),
      );

      await fs.copyFileSync(
          path.resolve(__dirname, `${configRoot}/configs/post-0.40-config.multinode.txt`),
          path.resolve(__dirname, `${baseFolder}/compose-network/network-node/config.multinode.txt`)
      );
    }
    else {
      await fs.copyFileSync(
          path.resolve(__dirname, `${configRoot}/configs/pre-0.40-config.txt`),
          path.resolve(__dirname, `${baseFolder}/compose-network/network-node/config.txt`),
      );

      await fs.copyFileSync(
          path.resolve(__dirname, `${configRoot}/configs/pre-0.40-config.multinode.txt`),
          path.resolve(__dirname, `${baseFolder}/compose-network/network-node/config.multinode.txt`)
      );
    }

    const relayRateLimitDisabled = !limits;
    if (relayRateLimitDisabled) {
      NodeController.setEnvValue(
        `${baseFolder}/.env`,
        "RELAY_HBAR_RATE_LIMIT_TINYBAR",
        "0"
      );
      NodeController.setEnvValue(
        `${baseFolder}/.env`,
        "RELAY_HBAR_RATE_LIMIT_DURATION",
        "0"
      );
    }
    NodeController.setEnvValue(
      `${baseFolder}/.env`,
      "RELAY_RATE_LIMIT_DISABLED",
      relayRateLimitDisabled
    );
    NodeController.setEnvValue(`${baseFolder}/.env`, "RELAY_DEV_MODE", devMode);
    NodeController.setEnvValue(
      `${baseFolder}/.env`,
      "VUE_APP_LOCAL_MIRROR_NODE_URL",
      `http://${host}:5551/`
    )
    if (multiNode) {
      NodeController.setEnvValue(`${baseFolder}/.env`, "RELAY_HEDERA_NETWORK", '{"network-node:50211":"0.0.3","network-node-1:50211":"0.0.4","network-node-2:50211":"0.0.5","network-node-3:50211":"0.0.6"}');
    }
    if (result.code !== 0) {
      shell.echo("Failed to apply config");
      shell.exit(result.code);
    } else {
      shell.echo(`Successfully applied ${network} config settings`);
    }
    if (!fullMode || multiNode) {
      const yaml = require("js-yaml");
      const fs = require("fs");
      const application = yaml.load(fs.readFileSync(`${baseFolder}/compose-network/mirror-node/application.yml`));
      if (!fullMode) {
        application.hedera.mirror.importer.dataPath = 'file:///node/';
        application.hedera.mirror.importer.downloader.sources = [{ type: 'LOCAL' }];
      }
      if (multiNode) {
        application.hedera.mirror.monitor.nodes = [
          {
            "accountId": "0.0.3",
            "host": "network-node"
          },
          {
            "accountId": "0.0.4",
            "host": "network-node-1"
          },
          {
            "accountId": "0.0.5",
            "host": "network-node-2"
          },
          {
            "accountId": "0.0.6",
            "host": "network-node-3"
          }
        ]
      }
      fs.writeFileSync(`${baseFolder}/compose-network/mirror-node/application.yml`, yaml.dump(application, { lineWidth: 256 }));
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

  static getUserComposeFiles(dirPath = './overrides/') {
    dirPath = path.normalize(dirPath);
    if (!dirPath.endsWith(path.sep)) {
      dirPath += path.sep;
    }
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath)
        .filter(file => path.extname(file).toLowerCase() === '.yml')
        .sort().map(file => dirPath.concat(file));
      return files;
    } else {
      return [];
    }
  }

  static async parseEnvFile() {
    const baseFolder = path.resolve(__dirname, "../../");
    const env = (await fs.readFileSync(`${baseFolder}/.env`)).toString();
    const varsParsed = {};
    env.split('\n').forEach(line => {
      if (line.indexOf('=') !== -1) {
        const data = line.split('=').map(d => d.trim());
        varsParsed[data[0]] = data[1];
      }
    });
    return varsParsed;
  }

  static async isNetworkNodePost40() {
    // If the version number format is not standard then it is assumed to be post 0.40.0
    const envVarsParsed = await NodeController.parseEnvFile();
    const networkNodeEnvVar = 'NETWORK_NODE_IMAGE_TAG';
    const networkNodeVersion = process.env[networkNodeEnvVar] || envVarsParsed[networkNodeEnvVar];
    let isPost40 = true;
    if (networkNodeVersion) {
      const versionSplit = networkNodeVersion.split('.').map(v => parseInt(v));
      if (versionSplit.length >= 3 && versionSplit[0] === 0 && versionSplit[1] < 40) {
        isPost40 = false;
      }
    }

    return isPost40;
  }
};
