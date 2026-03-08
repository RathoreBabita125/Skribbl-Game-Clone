# ✏️ Sketchly – Skribbl.io Clone

A full-stack real-time multiplayer drawing and guessing game built with React, Node.js, and Socket.IO.

## 🚀 Live Demo

> Deploy using the instructions below to get your live URL.

---

## 🎮 Features

### Core Game
- ✅ **Multiplayer rooms** – Create or join rooms via code or link
- ✅ **Turn-based drawing** – One drawer per round; all others guess
- ✅ **Real-time drawing sync** – Canvas strokes broadcast via WebSockets to all players
- ✅ **Word selection** – Drawer picks from 1–5 random word choices
- ✅ **Guessing** – Type to guess; correct guesses earn points
- ✅ **Hints** – Letters revealed over time (configurable)
- ✅ **Scoring & leaderboard** – Points for speed and correctness
- ✅ **Game end with winner** – Final leaderboard and winner announcement

### Drawing Tools
- ✅ **Brush/Pen** – Draw with any color
- ✅ **20 colors** – Full color palette
- ✅ **5 brush sizes** – Thin to thick
- ✅ **Eraser** – Erase strokes
- ✅ **Undo** – Undo last stroke (synced to all viewers)
- ✅ **Clear canvas** – Clear entire canvas (drawer only)

### Room Management
- ✅ **Create room** – Configurable settings (players, rounds, draw time, hints)
- ✅ **Join via code or link** – Share a 6-character room code or invite link
- ✅ **Public rooms** – Browse and join open rooms
- ✅ **Private rooms** – Invite-only via link
- ✅ **Lobby** – See all players before the game starts

### Chat & Social
- ✅ **Guess input** – Chat doubles as guess input during drawing
- ✅ **Correct guess notification** – System messages for correct guesses
- ✅ **Close guess detection** – "Player X is close!" feedback
- ✅ **Lobby chat** – Chat before the game starts

---

## 🏗️ Architecture

```
sketchly/
├── server/          # Node.js + Express + Socket.IO backend
│   └── src/
│       ├── index.js      # Main server, socket event handlers
│       ├── Room.js       # Room class (participants, game state, broadcast)
│       ├── Game.js       # Game class (rounds, scoring, turn logic)
│       ├── Player.js     # Player class
│       └── words.js      # Word list (300+ words across 6 categories)
│
└── client/          # React + Vite frontend
    └── src/
        ├── App.jsx                    # App router
        ├── context/
        │   ├── SocketContext.jsx      # Socket.IO connection management
        │   └── GameContext.jsx        # Global game state (useReducer)
        ├── pages/
        │   ├── HomePage.jsx           # Create/join room UI
        │   ├── LobbyPage.jsx          # Pre-game lobby
        │   └── GamePage.jsx           # Main game screen
        └── components/
            ├── DrawingCanvas.jsx      # HTML5 Canvas with real-time sync
            ├── WordDisplay.jsx        # Word hint/reveal display
            ├── Chat.jsx               # Chat + guess input
            ├── PlayerList.jsx         # Scores + player status
            ├── RoundEnd.jsx           # End-of-round overlay
            └── GameOver.jsx           # Game over screen
```

### WebSocket Event Flow

**Drawing:**
1. Drawer mouse/touch → `draw_start / draw_move / draw_end` → Server
2. Server → `draw_data` → All other clients
3. Clients apply stroke to their local canvas
4. Server stores strokes for late joiners and undo replay

**Guessing:**
1. Player types guess → `guess` → Server
2. Server checks `guess.toLowerCase().trim() === word.toLowerCase().trim()`
3. Correct: Server calculates points (base + time bonus + early bonus) → `guess_result` → All clients
4. Incorrect: Broadcast as chat (close guesses get "is close!" message)

**Game State:**
- Server is authoritative for all game state
- Each `round_start` resets canvas and player round-state
- Timer runs server-side; `timer_tick` broadcasts every second
- Hints are scheduled with `setTimeout` based on `drawTime / (hints + 1)`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Canvas | HTML5 Canvas API (custom drawing logic) |
| Backend | Node.js + Express |
| WebSockets | Socket.IO 4.x |
| State | React useReducer + Context API |
| Styling | Custom CSS (no framework) |
| Fonts | Fredoka One + Nunito (Google Fonts) |

---

## 📦 Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# Clone/download the project
cd sketchly

# Install all dependencies
npm run install:all
# Or manually:
# cd server && npm install
# cd ../client && npm install
```

### Running

Open two terminals:

```bash
# Terminal 1: Start backend
npm run dev:server
# Server running on http://localhost:3001

# Terminal 2: Start frontend
npm run dev:client
# Client running on http://localhost:5173
```

Open http://localhost:5173 in multiple browser tabs/windows to test multiplayer.

---

## 🌐 Deployment

### Option 1: Render (Recommended)

1. Push code to GitHub
2. Go to [render.com](https://render.com) → New → Web Service

**Backend:**
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Add env var: `CLIENT_URL` = your frontend URL

**Frontend:**
- Root Directory: `client`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Add env var: `VITE_SERVER_URL` = your backend URL

### Option 2: Railway

1. Import repo to [railway.app](https://railway.app)
2. Create two services: `server/` and `client/`
3. Set environment variables as above

### Option 3: Vercel (Frontend) + Render (Backend)

Frontend on Vercel:
- Root Directory: `client`
- Build Command: `npm run build`
- Output Directory: `dist`
- Env var: `VITE_SERVER_URL` = Render backend URL

---

## 🎯 Scoring System

| Event | Points |
|-------|--------|
| Correct guess (base) | 200 pts |
| Time bonus | Up to 100 pts (proportional to time remaining) |
| Early guesser bonus | Up to 50 pts (decreases per correct guesser before you) |
| Drawer (per correct guesser) | 100 × (correct / total guessers) pts |

---

## ⚙️ Room Settings

| Setting | Range | Default |
|---------|-------|---------|
| Max Players | 2–20 | 8 |
| Rounds | 2–10 | 3 |
| Draw Time | 15–240s | 80s |
| Word Choices | 1–5 | 3 |
| Hints | 0–5 | 2 |

---

## 🃏 Word List

300+ words across 6 categories:
- 🐾 Animals (55 words)
- 📦 Objects (55 words)  
- 🍕 Food (55 words)
- 🏃 Actions (45 words)
- 🌍 Places (45 words)
- 🌿 Nature (45 words)

---

## 🔑 Key Code Concepts

### How drawing sync works
```
Drawer canvas event
  → getPos() normalizes coords (handles canvas scaling)
  → emit draw_start/move/end to server
  → Server stores in game.strokes[] for replay
  → Server broadcasts draw_data to all other clients
  → Clients call applyStroke() to render
```

### How undo works
```
Drawer clicks Undo
  → emit draw_undo to server
  → Server: game.undoLastStroke() removes strokes back to last draw_start
  → Server emits canvas_replay with remaining strokes[]
  → All clients: clear canvas, re-replay all strokes
```

### Word matching
```javascript
guess.trim().toLowerCase() === word.trim().toLowerCase()
// Case insensitive, trims whitespace
// "close" detection: word contains guess or vice versa (length > 3)
```
