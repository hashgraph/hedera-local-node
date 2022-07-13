const HederaSDK = require('@hashgraph/sdk');
const hethers = require('@hashgraph/hethers');
const ethers = require('ethers');

module.exports = class HederaUtils {
  static privateKeysECDSA = [
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

  static privateKeysAliasECDSA = [
    '0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524',
    '0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7',
    '0x45a5a7108a18dd5013cf2d5857a28144beadc9c70b3bdbd914e38df4e804b8d8',
    '0x6e9d61a325be3f6675cf8b7676c70e4a004d2308e3e182370a41f5653d52c6bd',
    '0x0b58b1bd44469ac9f813b5aeaf6213ddaea26720f0b2f133d08b6f234130a64f',
    '0x95eac372e0f0df3b43740fa780e62458b2d2cc32d6a440877f1cc2a9ad0c35cc',
    '0x6c6e6727b40c8d4b616ab0d26af357af09337299f09c66704146e14236972106',
    '0x5072e7aa1b03f531b4731a32a021f6a5d20d5ddc4e55acbb71ae202fc6f3a26d',
    '0x60fe891f13824a2c1da20fb6a14e28fa353421191069ba6b6d09dd6c29b90eff',
    '0xeae4e00ece872dd14fb6dc7a04f390563c7d69d16326f2a703ec8e0934060cc7',
  ];

  static privateKeysED25519 = [
    '0xa608e2130a0a3cb34f86e757303c862bee353d9ab77ba4387ec084f881d420d4',
    '0xbbd0894de0b4ecfa862e963825c5448d2d17f807a16869526bff29185747acdb',
    '0x8fd50f886a2e7ed499e7686efd1436b50aa9b64b26e4ecc4e58ca26e6257b67d',
    '0x62c966ebd9dcc0fc16a553b2ef5b72d1dca05cdf5a181027e761171e9e947420',
    '0x805c9f422fd9a768fdd8c68f4fe0c3d4a93af714ed147ab6aed5f0ee8e9ee165',
    '0xabfdb8bf0b46c0da5da8d764316f27f185af32357689f7e19cb9ec3e0f590775',
    '0xec299c9f17bb8bdd5f3a21f1c2bffb3ac86c22e84c325e92139813639c9c3507',
    '0xcb833706d1df537f59c418a00e36159f67ce3760ce6bf661f11f6da2b11c2c5a',
    '0x9b6adacefbbecff03e4359098d084a3af8039ce7f29d95ed28c7ebdb83740c83',
    '0x9a07bbdbb62e24686d2a4259dc88e38438e2c7a1ba167b147ad30ac540b0a3cd',
  ];

  static async generateECDSA(client, num, startup) {
    console.log('|------------------------------------------------------------------------------------------|');
    console.log('|------------------------------| Accounts list (ECDSA keys) |------------------------------|');
    console.log('|    id    |                            private key                             |  balance |');
    console.log('|------------------------------------------------------------------------------------------|');
    for (let i = 0; i < num; i++) {
      let wallet = hethers.Wallet.createRandom();
      if (startup && this.privateKeysECDSA[i]) {
        wallet = new hethers.Wallet(this.privateKeysECDSA[i]);
      }
      const tx = await new HederaSDK.AccountCreateTransaction()
          .setKey(HederaSDK.PublicKey.fromString(wallet._signingKey().compressedPublicKey))
          .setInitialBalance(HederaSDK.Hbar.fromTinybars(10000000000000))
          .execute(client);
      const getReceipt = await tx.getReceipt(client);

      console.log(`| ${getReceipt.accountId.toString()} - ${wallet._signingKey().privateKey} - ${HederaSDK.Hbar.fromTinybars(10000000000000)} |`);
    }
    console.log('|------------------------------------------------------------------------------------------|');
  }

  static async generateAliasECDSA(client, num, startup) {
    console.log('|--------------------------------------------------------------------------------------------------------------------------------------|');
    console.log('|--------------------------------------------------| Accounts list (Alias ECDSA keys) |------------------------------------------------|');
    console.log('|    id    |                  address                   |                             private key                            | balance |');
    console.log('|--------------------------------------------------------------------------------------------------------------------------------------|');
    for (let i = 0; i < num; i++) {
      let wallet = ethers.Wallet.createRandom();
      if (startup && this.privateKeysAliasECDSA[i]) {
        wallet = new ethers.Wallet(this.privateKeysAliasECDSA[i]);
      }

      let accountId = HederaSDK.PublicKey.fromString(wallet._signingKey().compressedPublicKey.replace('0x', '')).toAccountId(0, 0);
      const transferTransaction = new HederaSDK.TransferTransaction()
          .addHbarTransfer(accountId, new HederaSDK.Hbar(10000))
          .addHbarTransfer(HederaSDK.AccountId.fromString('0.0.2'), new HederaSDK.Hbar(-10000));
      const tx = await transferTransaction.execute(client);
      await tx.getReceipt(client);

      const accountInfo = await new HederaSDK.AccountInfoQuery({
        accountId: HederaSDK.AccountId.fromEvmAddress(0, 0, wallet.address)
      }).execute(client);

      console.log(`| ${accountInfo.accountId.toString()} - ${wallet.address} - ${wallet._signingKey().privateKey} - ${new HederaSDK.Hbar(10000)} |`);
    }
    console.log('|--------------------------------------------------------------------------------------------------------------------------------------|');
  }

  static async generateED25519(client, num, startup) {
    console.log('|------------------------------------------------------------------------------------------|');
    console.log('|-----------------------------| Accounts list (ED25519 keys) |-----------------------------|');
    console.log('|    id    |                            private key                             |  balance |');
    console.log('|------------------------------------------------------------------------------------------|');
    for (let i = 0; i < num; i++) {
      let wallet = (hethers.Wallet.createRandom({isED25519Type: true}));
      if (startup && this.privateKeysED25519[i]) {
        wallet = new hethers.Wallet({privateKey: this.privateKeysED25519[i], isED25519Type: true});
      }
      const tx = await new HederaSDK.AccountCreateTransaction()
          .setKey(HederaSDK.PublicKey.fromString(wallet._signingKey().compressedPublicKey))
          .setInitialBalance(HederaSDK.Hbar.fromTinybars(10000000000000))
          .execute(client);
      const getReceipt = await tx.getReceipt(client);

      console.log(`| ${getReceipt.accountId.toString()} - ${wallet._signingKey().privateKey} - ${HederaSDK.Hbar.fromTinybars(10000000000000)} |`);
    }
    console.log('|------------------------------------------------------------------------------------------|');
  }

  static async generateAccounts(num = 10, startup = false) {
    const client = HederaSDK.Client
        .forNetwork({
          '127.0.0.1:50211': '0.0.3'
        })
        .setOperator('0.0.2', '302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');

    await this.generateECDSA(client, num, startup);
    console.log('');
    await this.generateAliasECDSA(client, num, startup);
    console.log('');
    await this.generateED25519(client, num, startup);
  }
}
