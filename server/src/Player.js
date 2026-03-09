// class Player {
//   constructor(id, name, socketId) {
//     this.id = id;
//     this.name = name;
//     this.socketId = socketId;
//     this.score = 0;
//     this.isReady = false;
//     this.hasGuessedCorrectly = false;
//     this.isDrawing = false;
//     this.avatar = Math.floor(Math.random() * 12) + 1; // avatar index 1-12
//   }

//   addScore(points) {
//     this.score += points;
//   }

//   resetRoundState() {
//     this.hasGuessedCorrectly = false;
//     this.isDrawing = false;
//   }

//   toJSON() {
//     return {
//       id: this.id,
//       name: this.name,
//       score: this.score,
//       isReady: this.isReady,
//       hasGuessedCorrectly: this.hasGuessedCorrectly,
//       isDrawing: this.isDrawing,
//       isHost: this.isHost || false,
//       avatar: this.avatar
//     };
//   }
// }

// module.exports = Player;

class Player {
  constructor(id, name, socketId) {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.score = 0;
    this.isReady = false;
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
    this.avatar = Math.floor(Math.random() * 28); // 0-27 maps to color_atlas
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