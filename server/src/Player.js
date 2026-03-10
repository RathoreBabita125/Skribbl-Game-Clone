class Player {
  constructor(id, name, socketId, avatar) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isReady = false;
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
   
    this.avatar = avatar || {
      avatarIdx: Math.floor(Math.random() * 28),
      eyeIdx:    Math.floor(Math.random() * 57),
      mouthIdx:  Math.floor(Math.random() * 51),
    };
  }

  addScore(points) {
    this.score += points;
  }

  resetRoundState() {
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isReady: this.isReady,
      hasGuessedCorrectly: this.hasGuessedCorrectly,
      isDrawing: this.isDrawing,
      isHost: this.isHost || false,
      avatar: this.avatar
    };
  }
}

module.exports = Player;