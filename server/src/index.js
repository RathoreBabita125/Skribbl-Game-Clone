const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Room = require('./Room');

const app = express();
const server = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL 
  ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Room registry
const rooms = new Map(); // roomId -> Room

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter(r => !r.isPrivate && r.status === 'lobby' && !r.isFull())
    .map(r => r.toJSON());
  res.json(publicRooms);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(req.params.roomId.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json(room.toJSON());
});

// Cleanup empty rooms periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms.entries()) {
    if (room.isEmpty() || (room.status === 'ended' && now - room.createdAt > 30 * 60 * 1000)) {
      rooms.delete(id);
    }
  }
}, 60 * 1000);

// Socket.IO
io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // ─── Room Events ─────────────────────────────────────────────
  socket.on('create_room', ({ playerName, settings, isPrivate, avatar }) => {
    try {
      const room = new Room(playerName, settings || {}, isPrivate || false);
      room.io = io;
      rooms.set(room.id, room);

      // const result = room.addPlayer(socket.id, playerName);
      const result = room.addPlayer(socket.id, playerName, avatar);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.playerId = result.player.id;

      socket.emit('room_created', {
        roomId: room.id,
        player: result.player.toJSON(),
        players: room.getPlayerList(),
        settings: room.game.settings,
        isPrivate: room.isPrivate
      });

      console.log(`[Room] Created: ${room.id} by ${playerName}`);
    } catch (err) {
      console.error('[create_room error]', err);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  socket.on('join_room', ({ roomId, playerName, avatar }) => {
    try {
      const room = rooms.get(roomId?.toUpperCase());
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // const result = room.addPlayer(socket.id, playerName);
      const result = room.addPlayer(socket.id, playerName, avatar);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(room.id);
      socket.data.roomId = room.id;
      socket.data.playerId = result.player.id;

      // Tell joining player their info + room state
      socket.emit('room_joined', {
        roomId: room.id,
        player: result.player.toJSON(),
        players: room.getPlayerList(),
        settings: room.game.settings,
        isPrivate: room.isPrivate
      });

      // Tell everyone else a new player joined
      socket.to(room.id).emit('player_joined', {
        player: result.player.toJSON(),
        players: room.getPlayerList()
      });

      console.log(`[Room] ${playerName} joined ${room.id}`);
    } catch (err) {
      console.error('[join_room error]', err);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  socket.on('start_game', () => {
    try {
      const room = rooms.get(socket.data.roomId);
      if (!room) return;

      const player = room.getPlayer(socket.id);
      if (!player || !player.isHost) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      if (!room.canStart()) {
        socket.emit('error', { message: 'Need at least 2 players to start' });
        return;
      }

      room.startGame(io);
      console.log(`[Game] Started in room ${room.id}`);
    } catch (err) {
      console.error('[start_game error]', err);
    }
  });

  socket.on('player_ready', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    player.isReady = !player.isReady;

    io.to(room.id).emit('player_updated', {
      player: player.toJSON(),
      players: room.getPlayerList()
    });
  });

  // ─── Word Events ─────────────────────────────────────────────
  socket.on('word_chosen', ({ word }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    room.wordChosen(word, socket.id);
  });

  // ─── Drawing Events ───────────────────────────────────────────
  socket.on('draw_start', (data) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleDraw(socket.id, { type: 'start', ...data });
  });

  socket.on('draw_move', (data) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleDraw(socket.id, { type: 'move', ...data });
  });

  socket.on('draw_end', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleDraw(socket.id, { type: 'end' });
  });

  socket.on('canvas_clear', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleClearCanvas(socket.id);
  });

  socket.on('draw_undo', () => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleUndo(socket.id);
  });

  // ─── Chat & Guessing ──────────────────────────────────────────
  socket.on('guess', ({ text }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.getPlayer(socket.id);
    if (!player) return;

    if (room.status !== 'playing' || room.game.phase !== 'drawing') {
      // Just treat as chat when not in drawing phase
      room.handleChat(socket.id, text);
      return;
    }

    if (player.isDrawing) {
      // Drawer sends chat
      room.handleChat(socket.id, text);
    } else if (player.hasGuessedCorrectly) {
      // Already guessed correctly, chat only
      room.handleChat(socket.id, text);
    } else {
      room.handleGuess(socket.id, text);
    }
  });

  socket.on('chat', ({ text }) => {
    const room = rooms.get(socket.data.roomId);
    if (!room) return;
    room.handleChat(socket.id, text);
  });

  // ─── Disconnect ───────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    const room = rooms.get(socket.data.roomId);
    if (!room) return;

    const player = room.removePlayer(socket.id);
    if (!player) return;

    io.to(room.id).emit('player_left', {
      playerId: player.id,
      playerName: player.name,
      players: room.getPlayerList()
    });

    if (room.isEmpty()) {
      room._clearTimers?.();
      rooms.delete(room.id);
      console.log(`[Room] Deleted empty room: ${room.id}`);
    } else if (room.status === 'playing' && player.isDrawing) {
      // If drawer left, skip to next turn
      io.to(room.id).emit('chat_message', {
        playerId: 'system',
        playerName: 'System',
        text: `${player.name} (drawer) left the game. Skipping turn...`,
        type: 'system'
      });
      setTimeout(() => {
        if (room.status === 'playing') {
          const result = room.game.nextTurn(Array.from(room.players.values()));
          if (result === 'game_over') {
            room.status = 'ended';
            const leaderboard = room.game.getLeaderboard(Array.from(room.players.values()));
            io.to(room.id).emit('game_over', {
              winner: leaderboard[0],
              leaderboard
            });
          } else {
            room._startRound();
          }
        }
      }, 2000);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
