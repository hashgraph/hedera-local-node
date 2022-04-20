const HederaSDK = require('@hashgraph/sdk');
const hethers = require('@hashgraph/hethers');

module.exports = class HederaUtils {
  static privateKeys = [
    '0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6',
    '0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628',
    '0xb4d7f7e82f61d81c95985771b8abf518f9328d019c36849d4214b5f995d13814',
    '0x941536648ac10d5734973e94df413c17809d6cc5e24cd11e947e685acfbd12ae',
    '0x5829cf333ef66b6bdd34950f096cb24e06ef041c5f63e577b4f3362309125863',
    '0x8fc4bffe2b40b2b7db7fd937736c4575a0925511d7a0a2dfc3274e8c17b41d20',
    '0xb6c10e2baaeba1fa4a8b73644db4f28f4bf0912cceb6e8959f73bb423c33bd84',
    '0xfe8875acb38f684b2025d5472445b8e4745705a9e7adc9b0485a05df790df700',
    '0xbdc6e0a69f2921a78e9af930111334a41d3fab44653c8de0775572c526feea2d',
    '0x3e215c3d2a59626a669ed04ec1700f36c05c9b216e592f58bbfd3d8aa6ea25f9',
  ];

  static async generateAccounts(num = 10, startup = false) {
    const client = HederaSDK.Client
        .forNetwork({
          '127.0.0.1:50211': '0.0.3'
        })
        .setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');

    let accountsString = '---------- Accounts list:\n';
    for (let i = 0; i < num; i++) {
      let wallet = hethers.Wallet.createRandom();
      if (startup && this.privateKeys[i]) {
        wallet = new hethers.Wallet(this.privateKeys[i]);
      }
      const tx = await new HederaSDK.AccountCreateTransaction()
          .setKey(HederaSDK.PublicKey.fromString(wallet._signingKey().compressedPublicKey))
          .setInitialBalance(HederaSDK.Hbar.fromTinybars(10000000000000))
          .execute(client);
      const getReceipt = await tx.getReceipt(client);

      accountsString += `${getReceipt.accountId.toString()} - ${wallet._signingKey().privateKey} - ${HederaSDK.Hbar.fromTinybars(10000000000000)}\n`;
    }

    console.log(`${accountsString}---------- Total: ${num}`);
  }
}
