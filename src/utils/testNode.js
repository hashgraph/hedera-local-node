const {
    Client,
    PrivateKey,
    AccountCreateTransaction,
    AccountBalanceQuery,
    Hbar,
    TransferTransaction,
    AccountId,
    TransactionId,
    TokenCreateTransaction
} = require("@hashgraph/sdk");
const axios = require('axios');
require("dotenv").config();

async function main() {
    const myAccountId = process.env.RELAY_OPERATOR_ID_MAIN;
    const myPrivateKey = process.env.RELAY_OPERATOR_KEY_MAIN;

    if (myAccountId == null || myPrivateKey == null) {
      throw new Error(
        "Environment variables myAccountId and myPrivateKey must be present"
      );
    }
    const node = { "127.0.0.1:50211": new AccountId(3) };
    const client = Client.forNetwork(node).setMirrorNetwork("127.0.0.1:5600");
    client.setOperator(myAccountId, myPrivateKey);

    const newAccountId = await createAccount(client);
    await transferHbar(client, myAccountId, newAccountId);

    const { validStart } = await createHTSToken(client);
    const transactionIdFormatted = `${myAccountId}-${validStart.replace(/\./g,'-')}`;
    console.log(`- Mirror Node Explorer URL: http://localhost:9090/#/devnet/transaction/${transactionIdFormatted}`);
    await getTransactionInformation(transactionIdFormatted);
}


const getTransactionInformation = async function(transactionIdFormatted) {
    const url = "http://localhost:5551/api/v1/transactions/"+transactionIdFormatted
    console.log('- Mirror Node Url: ' + url)
    await sleep(5);
    axios.get(url, {})
    .then(function (response) {
        console.log(response.data.transactions);
        process.exit(0);
    })
}

const createAccount = async function (client) {
    const newAccountPrivateKey = await PrivateKey.generateED25519();
    const newAccountPublicKey = newAccountPrivateKey.publicKey;

    const newAccount = await new AccountCreateTransaction()
        .setKey(newAccountPublicKey)
        .setInitialBalance(Hbar.fromTinybars(1000))
        .execute(client);

    const getReceipt = await newAccount.getReceipt(client);
    const newAccountId = getReceipt.accountId;

    console.log("- New account ID is: " + newAccountId);

    const accountBalance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log(
        "- New account balance is: " +
            accountBalance.hbars.toTinybars() +
            " tinybar."
        );
    
    return newAccountId;
}

const transferHbar = async function (client, myAccountId, newAccountId) {
    await new TransferTransaction()
        .addHbarTransfer(myAccountId, Hbar.fromTinybars(-10000))
        .addHbarTransfer(newAccountId, Hbar.fromTinybars(10000))
        .execute(client);

    await sleep(5);

    const balance = await new AccountBalanceQuery()
        .setAccountId(newAccountId)
        .execute(client);

    console.log(
        "- New account balance after transfer is: " +
            balance.hbars.toTinybars() +
            " tinybar."
        );
}

const createHTSToken = async function(client) {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30);
    const tokenCreate = await (await new TokenCreateTransaction()
      .setTokenName("WrappedHedera")
      .setTokenSymbol("WHBAR")
      .setExpirationTime(expiration)
      .setDecimals(8)
      .setInitialSupply(200000000000)
      .setTreasuryAccountId(client.operatorAccountId)
      .setTransactionId(TransactionId.generate(client.operatorAccountId))
      .setNodeAccountIds([client._network.getNodeAccountIdsForExecute()[0]]))
      .setTransactionMemo('relay dapp test token create')
      .execute(client);
    
    const receipt = await tokenCreate.getReceipt(client);
    const transactionId = tokenCreate.transactionId.toString();
    const validStart = tokenCreate.transactionId.validStart.toString();
    const tokenId = receipt.tokenId.toString();
  
    console.log(`- HTS Token Deployed with id ${tokenId}, transactionId: ${transactionId}, valid start: ${validStart}`);
  
    return { tokenId, transactionId, validStart };
  };

const sleep = async function (seconds) {
    await new Promise(r => setTimeout(r, seconds * 1000 ));
}

main();