const blessed = require("blessed");
const contrib = require("blessed-contrib");
const ConnectionCheck = require("../helpers/connectionCheck");
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
    this.grid = new contrib.grid({ rows: 12, cols: 12, screen: this.screen });

    this.initInfoBoard();
    this.initStatusBoard();
    const consensusLog = this.initConsensusLog();
    const mirrorLog = this.initMirrorLog();
    const relayLog = this.initRelayLog();
    const accountBoard = this.initAccountBoard();


    //assign key events
    this.screen.key(['tab', 'C-c', '1', '2', '3', '4'], async function (ch, key) {
      if (key.name == 'tab'){
        this.screen.focusNext();
      }
      else if(ch == '1'){
        mirrorLog.hide();
        relayLog.hide();
        accountBoard.hide();
        consensusLog.show();
        consensusLog.focus();
      }
      else if(ch == '2'){
        relayLog.hide();
        accountBoard.hide();
        consensusLog.hide();
        mirrorLog.show();
        mirrorLog.focus();
      }
      else if(ch == '3'){
        mirrorLog.hide();
        accountBoard.hide();
        consensusLog.hide();
        relayLog.show();
        relayLog.focus();
      }
      else if(ch == '4'){
        mirrorLog.hide();
        relayLog.hide();
        consensusLog.hide();
        accountBoard.show();
        accountBoard.focus();
      }
      else{
        this.screen.destroy();
        // await NodeController.stopLocalNode();
        return process.exit(0);
      }
      this.screen.render();
    });
    this.screen.render();
  }

  initKeyEvents(screen, hideLogs){

  }

  initInfoBoard() {
    this.info =  this.grid.set(0, 2, 2, 3, contrib.table, 
      { keys: true
      , fg: 'green'
      , label: 'Commands Information'
      , columnSpacing: 1
      , columnWidth: [10, 30, 30]});
    this.info.setData({headers: ['Key', 'Command'], data: [['1','Open Accounts Info Board'],['2','Open Consensus Node Log Board'],['3','Open Mirror Node Log Board'],['4','Open Relay Log Board']]});
  }

  async initStatusBoard() {
    this.status =  this.grid.set(0, 0, 2, 2, contrib.table, 
      { keys: true
      , fg: 'green'
      , label: 'Status'
      , columnSpacing: 2
      , columnWidth: [15, 10, 10]});
    this.status.setData({headers: ['Application', 'Version', 'Status'], data: []});
  }

  async updateStatusBoard(){
    const data = [];
    const containers = [{
      name: 'Consensus Node',
      port: 5600
    },
    {
      name: 'Mirror Node',
      port: 5600
    },
    {
      name: 'Relay',
      port: 5600
    }]

    containers.forEach(async application => {
      var row = []
      row.push(application.name);
      row.push('latest');
      // let status = await ConnectionCheck.containerStatusCheck(application.port);
      // console.log(status);
      row.push('OK');
      data.push(row);
    })
    this.status.setData({headers: ['Application', 'Version', 'Status'], data: data});
    this.screen.render();
  }

  initConsensusLog() {
    this.consensusLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "green",
      selectedFg: "green",
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

  initMirrorLog() {
    this.mirrorLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "green",
      selectedFg: "green",
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

  initRelayLog() {
    this.relayLog = this.grid.set(2, 0, 10, 12, blessed.log, {
      fg: "green",
      selectedFg: "green",
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

  initAccountBoard() {
    this.accountBoard = this.grid.set(2, 0, 10, 12, blessed.log, {
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
    this.accountBoard.hide();

    return this.accountBoard;
  }

  hideLogs(accountBoard, consensusLog, mirrorLog, relayLog) {
    accountBoard.hide();
    consensusLog.hide();
    mirrorLog.hide();
    relayLog.hide();
  }

  showLogBoard(board) {
    board.show();
  }

  getAccountBoard() {
    return this.accountBoard;
  }
  
  getMirrorNodeLog() {
    return this.mirrorLog;
  }

  getConsensusLog() {
    return this.consensusLog;
  }
};
