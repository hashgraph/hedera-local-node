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
    const amount = 100_000_000_000;
    const amountbn = hre.ethers.BigNumber.from(amount);
    const senderBalanceBefore = await walletSender.getBalance();
    const receiverBalanceBefore = await walletReceiver.getBalance();

    await walletSender.sendTransaction({
      to: walletReceiver.address,
      value: amount
    });

    const senderBalanceAfter = await walletSender.getBalance();
    const receiverBalanceAfter = await walletReceiver.getBalance();

    expect(senderBalanceAfter.toString()).to.not.eq(senderBalanceBefore.toString());
    expect(senderBalanceAfter.lt(senderBalanceBefore.sub(amountbn))).to.eq(true); // account for used gas
    expect(receiverBalanceAfter.toString()).to.eq(receiverBalanceBefore.add(amountbn).toString());
  });
});
