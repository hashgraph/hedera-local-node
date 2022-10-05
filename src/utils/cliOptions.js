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
}
