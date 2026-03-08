const { v4: uuidv4 } = require('uuid');
const Player = require('./Player');
const Game = require('./Game');

class Room {
  constructor(hostName, settings, isPrivate = false) {
    this.id = this._generateRoomCode();
    this.hostName = hostName;
    this.isPrivate = isPrivate;
    this.players = new Map(); // socketId -> Player
    this.game = new Game(settings);
    this.status = 'lobby'; // lobby, playing, ended
    this.chatMessages = [];
    this.gameTimer = null;
    this.hintTimers = [];
    this.correctGuessCount = 0;
    this.io = null; // set after creation
    this.createdAt = Date.now();
  }

  _generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  addPlayer(socketId, playerName) {
    if (this.players.size >= this.game.settings.maxPlayers) {
      return { error: 'Room is full' };
    }
    if (this.status === 'playing') {
      return { error: 'Game already in progress' };
    }

    const id = uuidv4();
    const player = new Player(id, playerName, socketId);

    // First player is host
    if (this.players.size === 0) {
      player.isHost = true;
    }

    this.players.set(socketId, player);
    return { player };
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    this.players.delete(socketId);

    // If host left, assign new host
    if (player.isHost && this.players.size > 0) {
      const newHost = this.players.values().next().value;
      newHost.isHost = true;
    }

    return player;
  }

  getPlayer(socketId) {
    return this.players.get(socketId);
  }

  getPlayerById(playerId) {
    for (const player of this.players.values()) {
      if (player.id === playerId) return player;
    }
    return null;
  }

  getPlayerBySocketId(socketId) {
    return this.players.get(socketId);
  }

  getPlayerList() {
    return Array.from(this.players.values()).map(p => p.toJSON());
  }

  getCurrentDrawerSocket() {
    const drawerId = this.game.getCurrentDrawerId();
    for (const [socketId, player] of this.players.entries()) {
      if (player.id === drawerId) return socketId;
    }
    return null;
  }

  startGame(io) {
    this.io = io;
    this.status = 'playing';
    const playerList = Array.from(this.players.values());
    this.game.start(playerList);
    this._startRound();
  }

  _startRound() {
    const drawerId = this.game.getCurrentDrawerId();
    const drawerSocket = this.getCurrentDrawerSocket();
    const drawer = this.getPlayerById(drawerId);

    if (!drawer) return;

    // Mark drawer
    this.players.forEach(p => { p.isDrawing = false; p.hasGuessedCorrectly = false; });
    drawer.isDrawing = true;
    this.correctGuessCount = 0;

    // Send word options to drawer only
    const wordOptions = this.game.getWordOptions();
    this.game.wordOptions = wordOptions;

    // Broadcast round start to all
    this.io.to(this.id).emit('round_start', {
      round: this.game.currentRound,
      totalRounds: this.game.settings.rounds,
      drawerId: drawer.id,
      drawerName: drawer.name,
      drawTime: this.game.settings.drawTime,
      players: this.getPlayerList()
    });

    // Send word options only to drawer
    if (drawerSocket) {
      this.io.to(drawerSocket).emit('word_options', { words: wordOptions });
    }

    // Auto-choose word after 15 seconds if drawer doesn't pick
    this._wordSelectionTimer = setTimeout(() => {
      if (this.game.phase === 'word_selection') {
        const autoWord = wordOptions[0];
        this._wordChosen(autoWord, drawerSocket);
      }
    }, 15000);
  }

  wordChosen(word, socketId) {
    const player = this.players.get(socketId);
    if (!player || !player.isDrawing) return false;
    if (this.game.phase !== 'word_selection') return false;

    clearTimeout(this._wordSelectionTimer);
    this._wordChosen(word, socketId);
    return true;
  }

  _wordChosen(word, drawerSocket) {
    const wordHint = this.game.chooseWord(word);
    const drawerId = this.game.getCurrentDrawerId();
    const drawer = this.getPlayerById(drawerId);

    // Tell everyone the word hint and that drawing has started
    this.io.to(this.id).emit('drawing_started', {
      drawerId,
      drawerName: drawer ? drawer.name : 'Unknown',
      wordHint,
      wordLength: word.length,
      drawTime: this.game.settings.drawTime
    });

    // Tell drawer the actual word
    if (drawerSocket) {
      this.io.to(drawerSocket).emit('your_word', { word, wordHint });
    }

    // Start game timer
    this.game.timeLeft = this.game.settings.drawTime;
    this._startGameTimer();

    // Schedule hints
    if (this.game.settings.hints > 0) {
      this._scheduleHints();
    }
  }

  _startGameTimer() {
    this._clearTimers();

    this.gameTimer = setInterval(() => {
      this.game.timeLeft--;

      this.io.to(this.id).emit('timer_tick', { timeLeft: this.game.timeLeft });

      if (this.game.timeLeft <= 0) {
        this._endRound('timeout');
      }
    }, 1000);
  }

  _scheduleHints() {
    const { drawTime, hints } = this.game.settings;
    const hintInterval = Math.floor(drawTime / (hints + 1));

    for (let i = 1; i <= hints; i++) {
      const timer = setTimeout(() => {
        if (this.game.phase === 'drawing') {
          const newHint = this.game.revealHint();
          this.io.to(this.id).emit('hint_revealed', { wordHint: newHint });
        }
      }, hintInterval * i * 1000);
      this.hintTimers.push(timer);
    }
  }

  _clearTimers() {
    if (this.gameTimer) {
      clearInterval(this.gameTimer);
      this.gameTimer = null;
    }
    this.hintTimers.forEach(t => clearTimeout(t));
    this.hintTimers = [];
    if (this._wordSelectionTimer) {
      clearTimeout(this._wordSelectionTimer);
      this._wordSelectionTimer = null;
    }
  }

  handleGuess(socketId, text) {
    const player = this.players.get(socketId);
    if (!player) return;
    if (player.isDrawing) return; // drawer can't guess
    if (player.hasGuessedCorrectly) return; // already guessed

    if (this.game.phase !== 'drawing') return;

    const isCorrect = this.game.checkGuess(text);

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      this.correctGuessCount++;

      const points = this.game.calculatePoints(
        this.game.timeLeft,
        this.game.settings.drawTime,
        this.correctGuessCount - 1
      );
      player.addScore(points);

      this.io.to(this.id).emit('guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points,
        players: this.getPlayerList()
      });

      // Check if all non-drawers have guessed
      const nonDrawers = Array.from(this.players.values()).filter(p => !p.isDrawing);
      const allGuessed = nonDrawers.every(p => p.hasGuessedCorrectly);

      if (allGuessed) {
        this._endRound('all_guessed');
      }
    } else {
      // Close guess: contains the word
      const wordLower = (this.game.currentWord || '').toLowerCase();
      const guessLower = text.toLowerCase();
      const isClose = wordLower.length > 3 && 
        (wordLower.includes(guessLower) || guessLower.includes(wordLower));

      // Broadcast as chat (don't reveal the guess content to drawer)
      this.io.to(this.id).emit('chat_message', {
        playerId: player.id,
        playerName: player.name,
        text: isClose ? `${player.name} is close!` : text,
        type: isClose ? 'close' : 'guess'
      });
    }
  }

  handleChat(socketId, text) {
    const player = this.players.get(socketId);
    if (!player) return;

    this.io.to(this.id).emit('chat_message', {
      playerId: player.id,
      playerName: player.name,
      text,
      type: 'chat'
    });
  }

  _endRound(reason) {
    this._clearTimers();
    this.game.phase = 'round_end';

    // Drawer gets points based on correct guesses
    const drawerSocket = this.getCurrentDrawerSocket();
    const drawer = this.getPlayerById(this.game.getCurrentDrawerId());
    if (drawer) {
      const nonDrawers = Array.from(this.players.values()).filter(p => !p.isDrawing);
      const drawerPoints = this.game.calculateDrawerPoints(this.correctGuessCount, this.players.size);
      drawer.addScore(drawerPoints);
    }

    const leaderboard = this.game.getLeaderboard(Array.from(this.players.values()));

    this.io.to(this.id).emit('round_end', {
      word: this.game.currentWord,
      reason,
      leaderboard,
      players: this.getPlayerList()
    });

    // Wait 5 seconds then start next turn
    setTimeout(() => {
      const result = this.game.nextTurn(Array.from(this.players.values()));
      
      if (result === 'game_over') {
        this.status = 'ended';
        this.io.to(this.id).emit('game_over', {
          winner: leaderboard[0],
          leaderboard
        });
      } else {
        this._startRound();
      }
    }, 5000);
  }

  handleDraw(socketId, data) {
    const player = this.players.get(socketId);
    if (!player || !player.isDrawing) return;
    if (this.game.phase !== 'drawing') return;

    // Store stroke
    if (data.type === 'start') {
      this.game.addStroke({ type: 'start', ...data });
    } else if (data.type === 'move') {
      this.game.addStroke({ type: 'move', ...data });
    } else if (data.type === 'end') {
      this.game.addStroke({ type: 'end', ...data });
    }

    // Broadcast to all others
    this.io.to(this.id).except(socketId).emit('draw_data', data);
  }

  handleClearCanvas(socketId) {
    const player = this.players.get(socketId);
    if (!player || !player.isDrawing) return;

    this.game.clearCanvas();
    this.io.to(this.id).emit('canvas_cleared');
  }

  handleUndo(socketId) {
    const player = this.players.get(socketId);
    if (!player || !player.isDrawing) return;

    this.game.undoLastStroke();
    // Send full stroke replay
    this.io.to(this.id).emit('canvas_replay', { strokes: this.game.strokes });
  }

  isEmpty() {
    return this.players.size === 0;
  }

  isFull() {
    return this.players.size >= this.game.settings.maxPlayers;
  }

  canStart() {
    return this.players.size >= 2 && this.status === 'lobby';
  }

  toJSON() {
    return {
      id: this.id,
      playerCount: this.players.size,
      maxPlayers: this.game.settings.maxPlayers,
      status: this.status,
      isPrivate: this.isPrivate,
      rounds: this.game.settings.rounds,
      drawTime: this.game.settings.drawTime
    };
  }
}

module.exports = Room;
