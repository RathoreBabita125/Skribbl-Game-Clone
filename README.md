# Skribbl Game Clone

Welcome to this playful take on the classic drawing-and-guessing party game. Here you'll find a full-stack implementation that lets friends sketch, guess and compete in real time.

The project is split between a React-powered client and a Node.js server, with both sides talking through WebSockets. Whether you want to tinker with the UI, add new features or just run it locally for a little entertainment, this repo has everything you need.

## 🔗 Live Demo

 [https://skribbl-game-client.vercel.app/](https://skribbl-game-client.vercel.app/)

##  What's Inside

- **Client** (`client/`): A Vite-based React app that handles the user interface, drawing canvas, chat, and game flow.
- **Server** (`server/`): A lightweight Node.js/Express backend using `socket.io` to manage rooms, players, rounds, scores, and word selection.

##  Getting Started

Follow these steps to get the app running on your machine:

1. **Install dependencies**
   ```bash
   cd client && npm install
   cd ./server && npm install
   ```
2. **Start the server and client**
   Open two terminal windows/tabs:
   ```bash
   # in one terminal (from project root)
   cd server && npm start
   # in the other
   cd client && npm run dev
   ```
3. **Open your browser** and navigate to the URL shown by Vite (usually `http://localhost:5173`).
4. **Create or join a room**, invite friends, and start drawing!

>  The server will log useful messages when rooms are created or players connect. Check the terminal if something isn't working.

##  How the Game Works

- Each player picks a username and joins a room.
- One player is randomly chosen to draw a word while everyone else types guesses into the chat.
- Correct guesses earn points; the drawer also scores based on how many people guess correctly.
- After a set number of rounds, the player with the highest score wins.

The game state updates in real time so everyone stays in sync.

## Project Structure

```
client/        # React code
  ├─ public/    # static assets
  ├─ src/
      ├─ components/  # UI pieces (canvas, chat, player list...)
      └─ context/     # React contexts for game/socket state
server/        # Node.js API
  ├─ Game.js    # core game logic
  ├─ Room.js    # room management
  ├─ Player.js  # player helper
  └─ words.js   # word list used for rounds
```

## Contributing

Want to improve the game? Great! Here are a few guidelines:

1. Fork the repo and create a feature branch.
2. Stick to the existing coding style and react component patterns.
3. Add basic tests if you can.
4. Open a pull request and describe your changes.
