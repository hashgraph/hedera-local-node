const blessed = require("blessed");
const contrib = require("blessed-contrib");

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

    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.screen.key(["C-c"], function (ch, key) {
      return process.exit(0);
    });

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
    this.accountBoard = this.grid.set(0, 3, 3, 10, blessed.log, {
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

  log(msg){
    this.accountBoard.add(msg);
  }
};
