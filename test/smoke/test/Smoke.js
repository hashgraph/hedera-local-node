const { expect } = require("chai");
const hre = require("hardhat");

describe("Smoke Tests", async function () {
  let walletSender, walletReceiver;
  const WEBSOCKET_URL = 'ws://localhost:8546';

  before(async function () {
    const signers = await hre.ethers.getSigners();
    walletSender = signers[0];
    walletReceiver = signers[1];
  });

  describe("Relay", async function() {
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

  describe("Websocket server", async function() {
    let logger, provider;

    before(async function() {
      const Logger = await hre.ethers.getContractFactory("Logger");
      logger = await Logger.deploy({gasLimit: 1000000});
      await logger.waitForDeployment();

      provider = await new hre.ethers.WebSocketProvider(WEBSOCKET_URL);

      provider.websocket.on('close', (code, message) => {
        console.error(`Websocket closed: ${code}`);
        console.error(message);
      })

    });

    it("Should receive events for subscribed contract", async function() {
      const logHandled = new Promise(resolve => {
        provider.on({address: logger.target}, (event) => {
          expect(event).to.exist;
          expect(event.transactionHash).to.exist;
          expect(event.blockHash).to.exist;
          resolve();
        });
      });

      const tx = await logger.logEvent(1, 2, {gasLimit: 100000});
      const rec = await tx.wait();

      expect(rec).to.exist;
      expect(rec.hash).to.exist;

      await logHandled;

    }).timeout(10000);
  });
});
