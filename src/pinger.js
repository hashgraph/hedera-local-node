const HederaSDK = require('@hashgraph/sdk');

(async () => {
  const client = HederaSDK.Client
      .forNetwork({
        '127.0.0.1:50211': '0.0.3'
      })
      .setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');

  while (true) {
    const transfer = await new HederaSDK.TransferTransaction()
        .addHbarTransfer('0.0.2', new HederaSDK.Hbar(1).negated())
        .addHbarTransfer('0.0.1000', new HederaSDK.Hbar(1));
    await transfer.execute(client);
    await new Promise(r => setTimeout(r, 300));
  }
})();
