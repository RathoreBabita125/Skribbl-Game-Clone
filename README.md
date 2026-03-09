# Skribbl Game Clone

This repository contains a drawing and guessing multiplayer game built with a React frontend and a Node.js server. The client is located in the `client` folder and the server code lives under `server`.

## Overview

- Players join a room and take turns drawing a word while others guess.
- The game tracks rounds, scores, and updates in real-time via web sockets.

## Structure

- `client/`: React application using Vite for development
- `server/`: Node.js backend with socket.io handling game logic

## Getting Started

1. Install dependencies in both `client` and `server`:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
2. Run the server and client in separate terminals:
   ```bash
   # from root
   cd server && npm start
   # new terminal
   cd client && npm run dev
   ```

## Contributing

Feel free to submit issues or pull requests. Follow the existing code style and keep changes focused.

## License

This project is open source and available under the MIT License.