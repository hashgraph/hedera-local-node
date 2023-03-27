module.exports = class CliOptions {
  static addAccountsOption(yargs) {
    yargs.positional('accounts', {
      describe: 'Generated accounts of each type.',
      default: 10,
    })
  }

  static addDetachedOption(yargs) {
    yargs.option("detached", {
      alias: 'd',
      type: 'boolean',
      describe: 'Run the local node in detached mode',
      demandOption: false,
    })
  }

  static addHostOption(yargs) {
    yargs.option("host", {
      alias: 'h',
      type: 'string',
      describe: 'Run the local node with host',
      demandOption: false,
      default: '127.0.0.1',
    })
  }

  static addNetworkOption(yargs) {
    yargs.option("network", {
      alias: 'n',
      type: 'string',
      describe: "Select the network configuration. Pre-built configs: ['mainnet', 'previewnet', 'testnet', 'local']",
      demandOption: false,
      default: 'local',
    })
  }

  static addRateLimitOption(yargs) {
    yargs.option("limits", {
      alias: 'l',
      type: 'boolean',
      describe: "Enable or disable the rate limits in the JSON-RPC relay",
      demandOption: false,
      default: true,
    })
  }

  static addTimestampOption(yargs) {
    yargs.option("timestamp", {
      type: 'string',
      describe: "Record file timestamp",
      demandOption: true,
    })
  }

  static addDevModeOption(yargs) {
    yargs.option("dev", {
      type: 'boolean',
      describe: "Enable or disable developer mode",
      demandOption: false,
      default: false,
    })
  }

  static addFullModeOption(yargs) {
    yargs.option("full", {
      type: 'boolean',
      describe: "Enable or disable full mode. Production local-node.",
      demandOption: false,
      default: false,
    })
  }

  static addBalanceOption(yargs) {
    yargs.option('balance', {
      type: 'number',
      describe: "Set starting balance of the created accounts in HBAR",
      demandOption: false,
      default: 10000,
    })
  }
}
