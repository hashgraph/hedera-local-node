const NodeController = require("./nodeController");
const HederaSDK = require("@hashgraph/sdk");
const hethers = require("@hashgraph/hethers");
const ethers = require("ethers");
const fs = require("fs");
const path = require("path");
const shell = require("shelljs");
const dotenv = require("dotenv");
const { AccountService } = require("./accountService");

module.exports = class HederaUtils {
  static async importFees(host = "127.0.0.1") {
    const timestamp = Date.now();
    const client = HederaSDK.Client.forNetwork({
      [`${host}:50211`]: "0.0.3",
    }).setOperator(
        "0.0.2",
        "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137"
    );

    const feesFileId = 111;
    const queryFees = new HederaSDK.FileContentsQuery()
        .setFileId(`0.0.${feesFileId}`);
    const fees = (await queryFees.execute(client)).toString('hex');
    await shell.exec(
        `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${fees}', 'hex'), ${timestamp + '000000'}, ${feesFileId}, 17);" >> ${NodeController.getNullOutput()}`
    );

    const exchangeRatesFileId = 112;
    const queryExchangeRates = new HederaSDK.FileContentsQuery()
        .setFileId(`0.0.${exchangeRatesFileId}`);
    const exchangeRates = (await queryExchangeRates.execute(client)).toString('hex');
    await shell.exec(
        `docker exec mirror-node-db psql mirror_node -U mirror_node -c "INSERT INTO public.file_data(file_data, consensus_timestamp, entity_id, transaction_type) VALUES (decode('${exchangeRates}', 'hex'), ${timestamp + '000001'}, ${exchangeRatesFileId}, 17);" >> ${NodeController.getNullOutput()}`
    );
  }

  static async waitForMonitorTopicCreation() {
    const LOG_SEARCH_TEXT = 'Created TOPIC entity';

    return new Promise((resolve, reject) => {
      const command = shell.exec(`docker logs mirror-node-monitor -f`, {silent: true, async: true})
      command.stdout.on('data', (data) => {
        if (data.indexOf(LOG_SEARCH_TEXT) !== -1) {
          command.kill('SIGINT');
          command.stdout.destroy();
          resolve();
        }
      });
    })
  }

  /**
   * Prepare the node for inital startup, wait for topic creation, import fees and generate accounts
   * @param {boolean} async
   * @param {any} logger
   * @param {number} balance
   * @param {boolean} num
   * @param {startup} boolean
   * @param {string} host
   */
  static async prepareNode(
    async,
    logger,
    balance,
    num = 10,
    startup = false,
    host = "127.0.0.1"
  ) {
    const client = HederaSDK.Client.forNetwork({
      [`${host}:50211`]: "0.0.3",
    }).setOperator(
      "0.0.2",
      "302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137"
    );
    if (startup) {
      logger.log("Importing fees...");
      await HederaUtils.importFees(host);
  
      // Mirror Node Monitor creates a Topic Entity. If that happens during the account generation step
      // all consecutive AccountIds get shifted by 1 and the private keys no longer correspond to the
      // expected AccountIds.
      logger.log("Waiting for topic creation...");
      await this.waitForMonitorTopicCreation();
    }

    const accountService = new AccountService({ client, logger });
    await accountService.generate(async, balance, num, startup);
  }

  static async debug(logger, timestamp) {
    dotenv.config();
    const timestampRegEx = /^\d{10}[\.-]\d{9}$/;
    if (!timestampRegEx.test(timestamp)) {
      logger.log(
        "Invalid timestamp string. Accepted formats are: 0000000000.000000000 and 0000000000-000000000"
      );
      return;
    }

    // Parse the timestamp to a record file filename
    let jsTimestamp = timestamp
      .replace(".", "")
      .replace("-", "")
      .substring(0, 13);
    jsTimestamp = parseInt(jsTimestamp);

    // Copy the record file to a temp directory
    const recordFilesDir = path.resolve(
      __dirname,
      "../../network-logs/node/recordStreams/record0.0.3"
    );
    const tempDir = path.resolve(__dirname, "../record-parser/temp");
    const files = fs.readdirSync(recordFilesDir);
    let recordFileFound = false;
    const recordExt = `.${process.env.STREAM_EXTENSION}`;
    for (let file of files) {
      const recordFileName = file.replace(recordExt, "");
      let fileTimestamp = new Date(
        recordFileName.replace(/\_/g, ":")
      ).getTime();
      if (fileTimestamp >= jsTimestamp) {
        if (file.endsWith(recordExt)) {
          logger.log(`Parsing record file [${file}]\n`);
        }
        recordFileFound = true;
        const sigFile = recordFileName + ".rcd_sig";
        fs.copyFileSync(
          path.resolve(recordFilesDir, file),
          path.resolve(tempDir, file)
        );
        fs.copyFileSync(
          path.resolve(recordFilesDir, sigFile),
          path.resolve(tempDir, sigFile)
        );
        break;
      }
    }

    if (!recordFileFound) {
      logger.log("No record file was found for the provided timestamp");
      return;
    }

    // Perform the parsing
    await shell.exec(
      `docker exec network-node bash /opt/hgcapp/recordParser/parse.sh`
    );

    // Clean temp directory
    for (const tempFile of fs.readdirSync(tempDir)) {
      if (tempFile !== ".gitignore") {
        fs.unlinkSync(path.resolve(tempDir, tempFile));
      }
    }
  }
};
