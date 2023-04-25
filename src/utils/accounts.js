import { Wallet, hethers } from "@hashgraph/hethers";
const HederaSDK = require("@hashgraph/sdk");

export default class Accounts {
    privateKeysECDSA = [
        "0x7f109a9e3b0d8ecfba9cc23a3614433ce0fa7ddcc80f2a8f10b222179a5a80d6",
        "0x6ec1f2e7d126a74a1d2ff9e1c5d90b92378c725e506651ff8bb8616a5c724628",
        "0xb4d7f7e82f61d81c95985771b8abf518f9328d019c36849d4214b5f995d13814",
        "0x941536648ac10d5734973e94df413c17809d6cc5e24cd11e947e685acfbd12ae",
        "0x5829cf333ef66b6bdd34950f096cb24e06ef041c5f63e577b4f3362309125863",
        "0x8fc4bffe2b40b2b7db7fd937736c4575a0925511d7a0a2dfc3274e8c17b41d20",
        "0xb6c10e2baaeba1fa4a8b73644db4f28f4bf0912cceb6e8959f73bb423c33bd84",
        "0xfe8875acb38f684b2025d5472445b8e4745705a9e7adc9b0485a05df790df700",
        "0xbdc6e0a69f2921a78e9af930111334a41d3fab44653c8de0775572c526feea2d",
        "0x3e215c3d2a59626a669ed04ec1700f36c05c9b216e592f58bbfd3d8aa6ea25f9",
    ];
    
    privateKeysAliasECDSA = [
        "0x105d050185ccb907fba04dd92d8de9e32c18305e097ab41dadda21489a211524",
        "0x2e1d968b041d84dd120a5860cee60cd83f9374ef527ca86996317ada3d0d03e7",
        "0x45a5a7108a18dd5013cf2d5857a28144beadc9c70b3bdbd914e38df4e804b8d8",
        "0x6e9d61a325be3f6675cf8b7676c70e4a004d2308e3e182370a41f5653d52c6bd",
        "0x0b58b1bd44469ac9f813b5aeaf6213ddaea26720f0b2f133d08b6f234130a64f",
        "0x95eac372e0f0df3b43740fa780e62458b2d2cc32d6a440877f1cc2a9ad0c35cc",
        "0x6c6e6727b40c8d4b616ab0d26af357af09337299f09c66704146e14236972106",
        "0x5072e7aa1b03f531b4731a32a021f6a5d20d5ddc4e55acbb71ae202fc6f3a26d",
        "0x60fe891f13824a2c1da20fb6a14e28fa353421191069ba6b6d09dd6c29b90eff",
        "0xeae4e00ece872dd14fb6dc7a04f390563c7d69d16326f2a703ec8e0934060cc7",
    ];

    privateKeysED25519 = [
        "0xa608e2130a0a3cb34f86e757303c862bee353d9ab77ba4387ec084f881d420d4",
        "0xbbd0894de0b4ecfa862e963825c5448d2d17f807a16869526bff29185747acdb",
        "0x8fd50f886a2e7ed499e7686efd1436b50aa9b64b26e4ecc4e58ca26e6257b67d",
        "0x62c966ebd9dcc0fc16a553b2ef5b72d1dca05cdf5a181027e761171e9e947420",
        "0x805c9f422fd9a768fdd8c68f4fe0c3d4a93af714ed147ab6aed5f0ee8e9ee165",
        "0xabfdb8bf0b46c0da5da8d764316f27f185af32357689f7e19cb9ec3e0f590775",
        "0xec299c9f17bb8bdd5f3a21f1c2bffb3ac86c22e84c325e92139813639c9c3507",
        "0xcb833706d1df537f59c418a00e36159f67ce3760ce6bf661f11f6da2b11c2c5a",
        "0x9b6adacefbbecff03e4359098d084a3af8039ce7f29d95ed28c7ebdb83740c83",
        "0x9a07bbdbb62e24686d2a4259dc88e38438e2c7a1ba167b147ad30ac540b0a3cd",
    ];

    /**
     * @internal
     * @param {object} props
     * @param {number} props.balance
     * @param {HederaSDK.Client} props.client
     * @param {number} props.num
     * @param {any} props.logger
     */
    constructor(props) {
        this.balance = props.balance;
        this.client = props.client;
        this.num = props.num;
        this.logger = props.logger;
    }

    /**
     * Generate accounts synchronous, with correct accountID -> privateKey mapping.
     * @param {number} balance
     * @param {boolean} startup
     */
    async generateSync(balance, startup = false) {
        await this._generateECDSA(balance, startup);
        this.logger.log("");
        await this._generateAliasECDSA(balance, startup);
        this.logger.log("");
        await this._generateED25519(balance, startup);
    }

    /**
     * Generate accounts asynchronous.
     * @param {number} balance
     * @param {boolean} startup
     */
    async generateAsync(balance, startup = false) {

    }

    /**
     * @internal
     * Generate ECDSA accounts.
     * @param {number} balance
     * @param {boolean} startup
     */
    async _generateECDSA(balance, startup) {
        let ecdsaAccountNumCounter = 1002;
        this.logger.log(
          "|-----------------------------------------------------------------------------------------|"
        );
        this.logger.log(
          "|------------------------------| Accounts list (ECDSA keys) |-----------------------------|"
        );
        this.logger.log(
          "|    id    |                            private key                            |  balance |"
        );
        this.logger.log(
          "|-----------------------------------------------------------------------------------------|"
        );
        for (let i = 0; i < num; i++) {
          let wallet = hethers.Wallet.createRandom();
          if (startup && this.privateKeysECDSA[i]) {
            wallet = new hethers.Wallet(this.privateKeysECDSA[i]);
          }
          await this._createAccount(balance, ecdsaAccountNumCounter++, startup,  wallet);
        }
        this.logger.log(
          "|-----------------------------------------------------------------------------------------|"
        );
    }

    /**
     * @internal
     * Generate Alias ECDSA accounts.
     * @param {number} balance
     * @param {boolean} startup
     */
    async _generateAliasECDSA(balance, startup) {

    }

    /**
     * @internal
     * Generate ED25519 accounts.
     * @param {number} balance
     * @param {boolean} startup
     */
    async _generateED25519(balance, startup) {

    }

    /**
     * @internal
     * Creates account.
     * @param {number} balance
     * @param {number} accountNum
     * @param {boolean} startup
     * @param {Wallet} wallet
     */
    async _createAccount(balance, accountNum, startup, wallet) {
        const tx = await new HederaSDK.AccountCreateTransaction()
                        .setKey(
                            HederaSDK.PublicKey.fromString(
                                    wallet._signingKey().compressedPublicKey
                                )
                        )
                        .setInitialBalance(new HederaSDK.Hbar(this.startingHbarBalance))
                        .execute(this.client);

        let accoundId = `0.0.${accountNum}`;
        if (!startup) {
            const getReceipt = await tx.getReceipt(client);
            accoundId = getReceipt.accountId.toString();
        }

        this._logAccount(accoundId, new HederaSDK.Hbar(balance), wallet._signingKey().privateKey);
    }

    /**
     * @internal
     * Log account to console.
     * @param {number} accountId
     * @param {number} balance
     * @param {string} privateKey
     */
    _logAccount(accountId, balance, privateKey) {
        this.logger.log(
            `| ${accountId} - ${privateKey} - ${balance} |`
        );
    }
}