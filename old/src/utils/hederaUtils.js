const NodeController = require('./nodeController');
const HederaSDK = require('@hashgraph/sdk');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const dotenv = require('dotenv');
const { AccountService } = require('./accountService');

module.exports = class HederaUtils {

  /**
   * Prepare the node for inital startup, wait for topic creation, import fees and generate accounts
   * @param {boolean} async
   * @param {any} logger
   * @param {number} balance
   * @param {boolean} num
   * @param {startup} boolean
   * @param {string} host
   */
  static async prepareNode (
    async,
    logger,
    balance,
    num = 10,
    startup = false,
    host = '127.0.0.1'
  ) {

    const accountService = new AccountService({ client, logger });
    await accountService.generate(async, balance, num, startup);
  }

  static async debug (logger, timestamp) {
    dotenv.config();
    const timestampRegEx = /^\d{10}[.-]\d{9}$/;
    if (!timestampRegEx.test(timestamp)) {
      logger.log(
        'Invalid timestamp string. Accepted formats are: 0000000000.000000000 and 0000000000-000000000'
      );
      return;
    }

    // Parse the timestamp to a record file filename
    let jsTimestamp = timestamp
      .replace('.', '')
      .replace('-', '')
      .substring(0, 13);
    jsTimestamp = parseInt(jsTimestamp);

    // Copy the record file to a temp directory
    const recordFilesDir = path.resolve(
      __dirname,
      '../../network-logs/node/recordStreams/record0.0.3'
    );
    const tempDir = path.resolve(__dirname, '../record-parser/temp');
    const files = fs.readdirSync(recordFilesDir);
    let recordFileFound = false;
    const recordExt = `.${process.env.STREAM_EXTENSION}`;
    for (const file of files) {
      const recordFileName = file.replace(recordExt, '');
      const fileTimestamp = new Date(recordFileName.replace(/_/g, ':')).getTime();
      if (fileTimestamp >= jsTimestamp) {
        if (file.endsWith(recordExt)) {
          logger.log(`Parsing record file [${file}]\n`);
        }
        recordFileFound = true;
        const sigFile = recordFileName + '.rcd_sig';
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
      logger.log('No record file was found for the provided timestamp');
      return;
    }

    // Perform the parsing
    await shell.exec(
      'docker exec network-node bash /opt/hgcapp/recordParser/parse.sh'
    );

    // Clean temp directory
    for (const tempFile of fs.readdirSync(tempDir)) {
      if (tempFile !== '.gitignore') {
        fs.unlinkSync(path.resolve(tempDir, tempFile));
      }
    }
  }
};
