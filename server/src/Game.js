const { getRandomWords } = require('./words');

class Game {
  constructor(settings) {
    this.settings = {
      maxPlayers: settings.maxPlayers || 8,
      rounds: settings.rounds || 3,
      drawTime: settings.drawTime || 80,
      wordCount: settings.wordCount || 3,
      hints: settings.hints || 2,
      wordMode: settings.wordMode || 'normal'
    };

    this.currentRound = 0;
    this.currentDrawerIndex = 0;
    this.currentWord = null;
    this.wordOptions = [];
    this.phase = 'waiting'; // waiting, word_selection, drawing, round_end, game_over
    this.timer = null;
    this.timeLeft = 0;
    this.hintsRevealed = 0;
    this.hintTimer = null;
    this.wordHint = [];
    this.strokes = []; // canvas state
    this.roundScores = {};
    this.drawerOrder = [];
  }

  start(players) {
    this.currentRound = 1;
    this.currentDrawerIndex = 0;
    this.phase = 'word_selection';
    // shuffle drawer order
    this.drawerOrder = players.map(p => p.id).sort(() => Math.random() - 0.5);
    this.roundScores = {};
    players.forEach(p => {
      p.score = 0;
      p.resetRoundState();
    });
  }

  getCurrentDrawerId() {
    return this.drawerOrder[this.currentDrawerIndex];
  }

  getWordOptions() {
    return getRandomWords(this.settings.wordCount);
  }

  chooseWord(word) {
    this.currentWord = word;
    this.phase = 'drawing';
    this.timeLeft = this.settings.drawTime;
    this.hintsRevealed = 0;
    this.strokes = [];

    // Build hint array: show word length
    if (this.settings.wordMode === 'hidden') {
      this.wordHint = word.split('').map(() => '_');
    } else {
      this.wordHint = word.split('').map(c => c === ' ' ? ' ' : '_');
    }

    return this.wordHint;
  }

  revealHint() {
    if (!this.currentWord) return this.wordHint;

    const hiddenIndices = [];
    this.wordHint.forEach((c, i) => {
      if (c === '_') hiddenIndices.push(i);
    });

    if (hiddenIndices.length === 0) return this.wordHint;

    const randomIdx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    this.wordHint[randomIdx] = this.currentWord[randomIdx];
    this.hintsRevealed++;

    return [...this.wordHint];
  }

  checkGuess(guess) {
    if (!this.currentWord) return false;
    return guess.trim().toLowerCase() === this.currentWord.trim().toLowerCase();
  }

  calculatePoints(timeLeft, totalTime, correctCount) {
    const basePoints = 200;
    const timeBonus = Math.floor((timeLeft / totalTime) * 100);
    const earlyBonus = Math.max(0, 50 - correctCount * 10);
    return basePoints + timeBonus + earlyBonus;
  }

  calculateDrawerPoints(correctGuessCount, totalPlayers) {
    if (correctGuessCount === 0) return 0;
    return Math.floor((correctGuessCount / Math.max(1, totalPlayers - 1)) * 100);
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
  }

  clearCanvas() {
    this.strokes = [];
  }

  undoLastStroke() {
    // Remove strokes until we find the end of previous stroke
    if (this.strokes.length === 0) return;
    
    // Find the last draw_start and remove from there
    let i = this.strokes.length - 1;
    while (i >= 0 && this.strokes[i].type !== 'start') {
      i--;
    }
    if (i >= 0) {
      this.strokes = this.strokes.slice(0, i);
    }
  }

  nextTurn(players) {
    this.currentDrawerIndex++;
    
    // Check if round is over (all players have drawn)
    if (this.currentDrawerIndex >= this.drawerOrder.length) {
      this.currentRound++;
      this.currentDrawerIndex = 0;
      
      // Check if game is over
      if (this.currentRound > this.settings.rounds) {
        this.phase = 'game_over';
        return 'game_over';
      }
    }

    this.phase = 'word_selection';
    this.currentWord = null;
    this.wordHint = [];
    this.strokes = [];
    this.hintsRevealed = 0;
    
    players.forEach(p => p.resetRoundState());
    
    return 'next_turn';
  }

  getLeaderboard(players) {
    return players
      .map(p => ({ id: p.id, name: p.name, score: p.score, avatar: p.avatar }))
      .sort((a, b) => b.score - a.score);
  }

  getState(playerId, isDrawer) {
    return {
      phase: this.phase,
      round: this.currentRound,
      totalRounds: this.settings.rounds,
      drawTime: this.settings.drawTime,
      timeLeft: this.timeLeft,
      wordHint: this.wordHint,
      // Only reveal word to drawer
      word: isDrawer ? this.currentWord : null,
      wordLength: this.currentWord ? this.currentWord.length : 0,
      hintsRevealed: this.hintsRevealed,
      strokes: this.strokes
    };
  }
}

module.exports = Game;
