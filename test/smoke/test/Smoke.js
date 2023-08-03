const { expect } = require("chai");
const hre = require("hardhat");

describe("Smoke Tests", async function () {
  let walletSender, walletReceiver;

  before(async function () {
    const signers = await hre.ethers.getSigners();
    walletSender = signers[0];
    walletReceiver = signers[1];
  });

  it("Should perform a crypto transfer transaction", async function() {
    const amount = 100_000_000_000n;
    const senderBalanceBefore = await hre.ethers.provider.getBalance(walletSender);
    const receiverBalanceBefore = await hre.ethers.provider.getBalance(walletReceiver);

    await walletSender.sendTransaction({
      to: walletReceiver.address,
      value: amount
    });
    await new Promise(r => setTimeout(r, 500)); // add wait, because otherwise balance is not correctly updated
    const senderBalanceAfter = await hre.ethers.provider.getBalance(walletSender);
    const receiverBalanceAfter = await hre.ethers.provider.getBalance(walletReceiver);

    expect(senderBalanceAfter.toString()).to.not.eq(senderBalanceBefore.toString());
    expect(senderBalanceAfter < (senderBalanceBefore - amount)).to.eq(true); // account for used gas
    expect(receiverBalanceAfter).to.greaterThan(receiverBalanceBefore);
  });
});
