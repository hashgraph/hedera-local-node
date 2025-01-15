// SPDX-License-Identifier: Apache-2.0

import {
    Client,
    AccountId,
    PrivateKey,
    Hbar,
    AccountCreateTransaction,
} from "@hashgraph/sdk";

const operatorId = AccountId.fromString('0.0.2');
const operatorKey = PrivateKey.fromString('302e020100300506032b65700422042091132178e72057a1d7528025956fe39b0b847f200ab59b2fdd367017f3087137');
const client = Client.forNetwork({"http://127.0.0.1:50213":"0.0.3"}).setOperator(operatorId, operatorKey);

client.setDefaultMaxTransactionFee(new Hbar(100));

async function accountCreateFcn(pvKey, iBal, client) {
    const response = await new AccountCreateTransaction()
        .setInitialBalance(iBal)
        .setKey(pvKey.publicKey)
        .setMaxAutomaticTokenAssociations(10)
        .execute(client);
    const receipt = await response.getReceipt(client);
    return [receipt.status, receipt.accountId];
}

async function main() {
    const initBalance = new Hbar(10);
    const aliceKey = PrivateKey.generateED25519();
    const [aliceSt, aliceId] = await accountCreateFcn(aliceKey, initBalance, client);
    console.log(`- Alice's account is created: ${aliceId}`);
    console.log(aliceSt);
    console.log(`- Done \n`);
    document.body.innerHTML = aliceSt;
}
main();