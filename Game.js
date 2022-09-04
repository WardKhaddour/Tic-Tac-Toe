class Game {
  constructor(socket1, socket2) {
    this.socket1 = socket1;
    this.socket2 = socket2;
    this.state = {};
  }
  initState() {
    this.state = {
      curPlayer: this.socket1.id,
      curMarker: 'X',
      gameOver: false,
      board: {
        1: '',
        2: '',
        3: '',
        4: '',
        5: '',
        6: '',
        7: '',
        8: '',
        9: '',
      },
    };
  }
  togglePlayer() {
    if (this.state.curPlayer == this.socket1.id) {
      this.socket1.emit('opponent turn');
      this.socket2.emit('my turn');
      this.state.curPlayer = this.socket2.id;
    } else {
      this.socket1.emit('my turn');
      this.socket2.emit('opponent turn');
      this.state.curPlayer = this.socket1.id;
    }
  }
  toggleMarker() {
    if (this.state.curMarker == 'X') this.state.curMarker = 'O';
    else this.state.curMarker = 'X';
  }
  checkWinner() {
    const winningCombos = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
      [1, 4, 7],
      [2, 5, 8],
      [3, 6, 9],
      [1, 5, 9],
      [3, 5, 7],
    ];
    for (let i = 0; i < winningCombos.length; i++) {
      const [a, b, c] = winningCombos[i];
      if (
        this.state.board[a] &&
        this.state.board[a] === this.state.board[b] &&
        this.state.board[a] === this.state.board[c]
      ) {
        this.state.gameOver = true;
        return this.state.board[a];
      }
    }
  }
  checkTie() {
    if (this.state.gameOver) return false;
    for (let i = 1; i <= 9; ++i) {
      if (this.state.board[i] === '') return false;
    }
    return true;
  }
  startGame() {
    this.initState();
    //Give symbol to each player
    this.socket1.emit('game started', 'X');
    this.socket2.emit('game started', 'O');

    //Give turns
    this.socket1.emit('my turn');
    this.socket2.emit('opponent turn');

    this.socket1.on('select cell', cell => {
      if (this.state.board[cell] === '') {
        this.state.board[cell] = this.state.curMarker;
        this.socket2.emit('cell selected', cell, this.state.curMarker);
        this.toggleMarker();
        this.togglePlayer();
      }
      if (this.checkWinner()) {
        this.socket1.emit('win');
        this.socket2.emit('lose');
      } else if (this.checkTie()) {
        this.socket1.emit('tie');
        this.socket2.emit('tie');
      }
    });

    this.socket2.on('select cell', cell => {
      if (this.state.board[cell] === '') {
        this.state.board[cell] = this.state.curMarker;
        this.socket1.emit('cell selected', cell, this.state.curMarker);
        this.toggleMarker();
        this.togglePlayer();
      }
      if (this.checkWinner()) {
        this.socket1.emit('lose');
        this.socket2.emit('win');
      } else if (this.checkTie()) {
        this.socket1.emit('tie');
        this.socket2.emit('tie');
      }
    });
  }
}

module.exports = Game;
