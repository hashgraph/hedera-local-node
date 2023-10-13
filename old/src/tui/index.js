const blessed = require("blessed");
const terminal = require("blessed-terminal");
const ConnectionCheck = require("../helpers/connectionCheck");
const DockerCheck = require("../helpers/dockerCheck");
const constants = require('../utils/constants');
const NodeController = require("../utils/nodeController");

module.exports = class TerminalUserInterface {
  screen;
  grid;
  status;
  consensusLog;
  mirrorLog;
  relayLog;
  accountBoard;
  info;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
    });
    this.screen.title = "Hedera Local Node";
    this.grid = new terminal.grid({ rows: 12, cols: 12, screen: this.screen });

    this.initInfoBoard();
    this.initStatusBoard();
    const consensusLog = this.initConsensusLog();
    const mirrorLog = this.initMirrorLog();
    const relayLog = this.initRelayLog();
    const accountBoard = this.initAccountBoard();

    //assign key events
    this.screen.key(
      ["tab", "C-c", "1", "2", "3", "4"],
      async function (ch, key) {
        if (key.name == "tab") {
          this.screen.focusNext();
        } else if (ch == "1") {
          mirrorLog.hide();
          relayLog.hide();
          accountBoard.hide();
          consensusLog.show();
          consensusLog.focus();
        } else if (ch == "2") {
          relayLog.hide();
          accountBoard.hide();
          consensusLog.hide();
          mirrorLog.show();
          mirrorLog.focus();
        } else if (ch == "3") {
          mirrorLog.hide();
          accountBoard.hide();
          consensusLog.hide();
          relayLog.show();
          relayLog.focus();
        } else if (ch == "4") {
          mirrorLog.hide();
          relayLog.hide();
          consensusLog.hide();
          accountBoard.show();
          accountBoard.focus();
        } else {
          this.screen.destroy();
          await NodeController.stopLocalNode();
          return process.exit(0);
        }
        this.screen.render();
      }
    );
    this.screen.render();
  }

  /**
   * Initialize info board screen
   */
  initInfoBoard() {
    this.info = this.grid.set(0, 7, 2, 3, terminal.table, {
      keys: true,
      fg: "white",
      label: "Commands Information",
      columnSpacing: 1,
      columnWidth: [10, 30, 30],
    });
    this.info.setData({
      headers: ["Key", "Command"],
      data: [
        ["1", "Open Consensus Node Board"],
        ["2", "Open Mirror Node Log Board"],
        ["3", "Open Relay Log Board"],
        ["4", "Open Account Board"],
      ],
    });
  }

  /**
   * Initialize status board screen
   */
  async initStatusBoard() {
    this.status = this.grid.set(0, 0, 2, 7, terminal.table, {
      keys: true,
      fg: "white",
      label: "Status",
      columnSpacing: 5,
      columnWidth: [15, 15, 15, 15, 15],
    });
    this.status.setData({
      headers: ["Application", "Version", "Status", "Host", "Port"],
      data: [],
    });
  }

  /**
   * Update status board screen
   */
  async updateStatusBoard(h) {
    let data = [];
    await Promise.all(
      constants.CONTAINERS.map(async (container) => {
        let row = [];
        const status = await ConnectionCheck.checkConnection(container.port)
        .then(
          function () {
            return `Running`;
          },
          function () {
            return "Not Running";
          }
        );

        const verison = await DockerCheck.getContainerVersion(container.label);
        row.push(container.name);
        row.push(verison);
        row.push(status);
        row.push(h);
        row.push(container.port)
        data.push(row);
      })
    );
    this.status.setData({
      headers: ["Application", "Version", "Status", "Host", "Port"],
      data: data,
    });
    this.screen.render();
  }

  /**
   * Initialize consensus node logger screen
   */
  initConsensusLog() {
    this.consensusLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "white",
      selectedFg: "white",
      label: "Consensus Node Log",
      scrollable: true,
      focused: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: " ",
        inverse: true,
      },
    });

    return this.consensusLog;
  }

  /**
   * Initialize mirror node logger screen
   */
  initMirrorLog() {
    this.mirrorLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "white",
      selectedFg: "white",
      label: "Mirror Node Log",
      scrollable: true,
      focused: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: " ",
        inverse: true,
      },
    });
    this.mirrorLog.hide();

    return this.mirrorLog;
  }

  /**
   * Initialize relay logger screen
   */
  initRelayLog() {
    this.relayLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "white",
      selectedFg: "white",
      label: "Relay Log",
      scrollable: true,
      focused: true,
      keys: true,
      vi: true,
      scrollbar: {
        ch: " ",
        inverse: true,
      },
    });
    this.relayLog.hide();

    return this.relayLog;
  }

  /**
   * Initialize account board screen
   */
  initAccountBoard() {
    this.accountBoard = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "white",
      selectedFg: "white",
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
    this.accountBoard.hide();

    return this.accountBoard;
  }

  /**
   * Return account screen logger object
   */
  getAccountBoard() {
    return this.accountBoard;
  }

  /**
   * Return mirror node screen logger object
   */
  getMirrorNodeLog() {
    return this.mirrorLog;
  }

  /**
   * Return consensus node screen logger object
   */
  getConsensusLog() {
    return this.consensusLog;
  }

  /**
   * Return relay screen logger object
   */
  getRelayLog() {
    return this.relayLog;
  }
};
