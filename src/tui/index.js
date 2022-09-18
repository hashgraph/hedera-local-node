const blessed = require("blessed");
const contrib = require("blessed-contrib");
const NodeController = require("../utils/nodeController");

module.exports = class TerminalUserInterface {
  screen;
  grid;
  status;
  eventBoard;
  accountBoard;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
    });
    this.screen.title = "Hedera Local Node";

    this.screen.key(["C-c"], async function (ch, key) {
        this.screen.destroy();
        await NodeController.stopLocalNode();
        return process.exit(0);
      });

    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.initStatusBoard();
    this.initEventBoard();
    this.initAccountBoard();
    this.screen.render();

    setInterval(function () {
      if (this.screen) {
        // log.add('1')
        this.screen.render();
      }
    }, 1000);
  }

  initStatusBoard() {
    this.status = this.grid.set(0, 0, 3, 2, blessed.log, { label: "Status" });
  }

  initEventBoard() {
    this.eventBoard = this.grid.set(3, 0, 9, 12, blessed.log, {
      fg: "green",
      selectedFg: "green",
      label: "Event Log",
      scrollable: true,
      focused: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: " ",
        inverse: true,
      },
    });
  }

  initAccountBoard() {
    this.accountBoard = this.grid.set(0, 2, 3, 10, blessed.log, {
      fg: "green",
      selectedFg: "green",
      label: "Account Board",
      scrollable: true,
      focused: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: " ",
        inverse: true,
      },
    });
  }

  getEventBoard() {
    return this.eventBoard;
  }

  getAccountBoard() {
    return this.accountBoard;
  }
};
