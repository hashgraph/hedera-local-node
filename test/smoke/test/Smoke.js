const { expect } = require("chai");
const hre = require("hardhat");

describe("Smoke Tests", async function () {
  let walletSender, walletReceiver;
  const WEBSOCKET_URL = 'http://localhost:8546';

  before(async function () {
    const signers = await hre.ethers.getSigners();
    walletSender = signers[0];
    walletReceiver = signers[1];
  });

  describe("Relay", async function() {
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
      expect(receiverBalanceAfter).to.greaterThan(receiverBalanceBefore);
    });
  });

  describe("Websocket server", async function() {
    let logger, provider;

    before(async function() {
      const Logger = await hre.ethers.getContractFactory("Logger");
      logger = await Logger.deploy({gasLimit: 1000000});
      logger = await logger.deployed();

      provider = await new hre.ethers.providers.WebSocketProvider(WEBSOCKET_URL);

      provider._websocket.on('close', (code, message) => {
        console.error(`Websocket closed: ${code}`);
        console.error(message);
      })

    });

    it("Should receive events for subscribed contract", async function() {
      const logHandled = new Promise(resolve => {
        provider.on({address: logger.address}, (event) => {
          expect(event).to.exist;
          expect(event.transactionHash).to.exist;
          expect(event.blockHash).to.exist;
          resolve();
        });
      });

      const tx = await logger.logEvent(1, 2, {gasLimit: 100000});
      const rec = await tx.wait();

      expect(rec).to.exist;
      expect(rec.transactionHash).to.exist;

      await logHandled;

    }).timeout(10000);
  });
});
