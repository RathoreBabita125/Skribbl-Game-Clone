import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './SocketContext';

const GameContext = createContext(null);

const initialState = {
  roomId: null,
  isPrivate: false,
  roomSettings: null,
  myPlayer: null,
  myPlayerId: null,      // stored separately so it never gets lost
  amHost: false,         // tracked locally — true if I created the room OR got host transfer
  players: [],
  gameStatus: 'idle',
  currentRound: 0,
  totalRounds: 0,
  currentDrawerId: null,
  currentDrawerName: null,
  wordHint: [],
  myWord: null,
  wordOptions: [],
  timeLeft: 0,
  drawTime: 80,
  strokes: [],
  messages: [],
  lastWord: null,
  leaderboard: [],
  error: null,
};

function reducer(state, action) {
  switch (action.type) {

    case 'ROOM_CREATED': {
      const players = action.payload.players;
      const myPlayer = action.payload.player;
      return {
        ...state,
        roomId: action.payload.roomId,
        isPrivate: action.payload.isPrivate,
        roomSettings: action.payload.settings,
        myPlayer,
        myPlayerId: myPlayer.id,
        amHost: true,          // creator is always host
        players,
        gameStatus: 'lobby',
        error: null
      };
    }

    case 'ROOM_JOINED': {
      const players = action.payload.players;
      const myPlayer = action.payload.player;
      // Check if server says we're host (shouldn't be for joiner, but just in case)
      const serverSaysHost = players.find(p => p.id === myPlayer.id)?.isHost === true;
      return {
        ...state,
        roomId: action.payload.roomId,
        isPrivate: action.payload.isPrivate,
        roomSettings: action.payload.settings,
        myPlayer,
        myPlayerId: myPlayer.id,
        amHost: serverSaysHost,
        players,
        gameStatus: 'lobby',
        error: null
      };
    }

    case 'PLAYER_JOINED':
    case 'PLAYER_UPDATED':
    case 'PLAYER_LEFT': {
      const players = action.payload.players;
      // Check if we became host (e.g. original host left)
      const meInList = players.find(p => p.id === state.myPlayerId);
      const amHost = state.amHost || meInList?.isHost === true;
      return {
        ...state,
        players,
        myPlayer: meInList || state.myPlayer,
        amHost
      };
    }

    case 'ROUND_START':
      return {
        ...state,
        gameStatus: 'word_selection',
        currentRound: action.payload.round,
        totalRounds: action.payload.totalRounds,
        currentDrawerId: action.payload.drawerId,
        currentDrawerName: action.payload.drawerName,
        players: action.payload.players,
        wordOptions: [],
        myWord: null,
        wordHint: [],
        strokes: [],
        lastWord: null,
        leaderboard: []
      };

    case 'WORD_OPTIONS':
      return { ...state, wordOptions: action.payload.words };

    case 'DRAWING_STARTED':
      return {
        ...state,
        gameStatus: 'drawing',
        wordHint: action.payload.wordHint,
        drawTime: action.payload.drawTime,
        timeLeft: action.payload.drawTime,
        currentDrawerId: action.payload.drawerId,
        currentDrawerName: action.payload.drawerName
      };

    case 'YOUR_WORD':
      return { ...state, myWord: action.payload.word, wordHint: action.payload.wordHint };

    case 'TIMER_TICK':
      return { ...state, timeLeft: action.payload.timeLeft };

    case 'HINT_REVEALED':
      return { ...state, wordHint: action.payload.wordHint };

    case 'GUESS_RESULT': {
      const updatedPlayers = action.payload.players || state.players;
      const meInList = updatedPlayers.find(p => p.id === state.myPlayerId);
      return {
        ...state,
        players: updatedPlayers,
        myPlayer: meInList || state.myPlayer,
      };
    }

    case 'CHAT_MESSAGE':
      return {
        ...state,
        messages: [...state.messages.slice(-100), action.payload]
      };

    case 'ROUND_END':
      return {
        ...state,
        gameStatus: 'round_end',
        lastWord: action.payload.word,
        leaderboard: action.payload.leaderboard,
        players: action.payload.players
      };

    case 'GAME_OVER':
      return {
        ...state,
        gameStatus: 'game_over',
        leaderboard: action.payload.leaderboard
      };

    case 'CANVAS_CLEARED':
      return { ...state, strokes: [] };

    case 'CANVAS_REPLAY':
      return { ...state, strokes: action.payload.strokes };

    case 'ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'LEAVE_ROOM':
      return { ...initialState };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const { socket } = useSocket();
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      room_created: (data) => dispatch({ type: 'ROOM_CREATED', payload: data }),
      room_joined:  (data) => dispatch({ type: 'ROOM_JOINED',  payload: data }),
      player_joined: (data) => dispatch({ type: 'PLAYER_JOINED', payload: data }),
      player_updated: (data) => dispatch({ type: 'PLAYER_UPDATED', payload: data }),
      player_left: (data) => {
        dispatch({ type: 'PLAYER_LEFT', payload: data });
        dispatch({ type: 'CHAT_MESSAGE', payload: {
          playerId: 'system', playerName: 'System',
          text: `${data.playerName} left the room`,
          type: 'system', id: Date.now()
        }});
      },
      round_start:    (data) => dispatch({ type: 'ROUND_START',    payload: data }),
      word_options:   (data) => dispatch({ type: 'WORD_OPTIONS',   payload: data }),
      drawing_started:(data) => dispatch({ type: 'DRAWING_STARTED',payload: data }),
      your_word:      (data) => dispatch({ type: 'YOUR_WORD',      payload: data }),
      timer_tick:     (data) => dispatch({ type: 'TIMER_TICK',     payload: data }),
      hint_revealed:  (data) => dispatch({ type: 'HINT_REVEALED',  payload: data }),
      guess_result: (data) => {
        dispatch({ type: 'GUESS_RESULT', payload: data });
        if (data.correct) {
          const isMe = data.playerId === stateRef.current.myPlayerId;
          dispatch({ type: 'CHAT_MESSAGE', payload: {
            playerId: 'system', playerName: 'System',
            text: isMe
              ? `🎉 You guessed the word! +${data.points} pts`
              : `✅ ${data.playerName} guessed the word! +${data.points} pts`,
            type: 'correct', id: Date.now()
          }});
        }
      },
      chat_message: (data) => dispatch({ type: 'CHAT_MESSAGE', payload: { ...data, id: Date.now() } }),
      round_end:    (data) => dispatch({ type: 'ROUND_END',  payload: data }),
      game_over:    (data) => dispatch({ type: 'GAME_OVER',  payload: data }),
      canvas_cleared: ()     => dispatch({ type: 'CANVAS_CLEARED' }),
      canvas_replay:  (data) => dispatch({ type: 'CANVAS_REPLAY', payload: data }),
      error: (data) => dispatch({ type: 'ERROR', payload: data.message }),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.keys(handlers).forEach(event => socket.off(event));
  }, [socket]);

  const actions = {
    createRoom:  useCallback((playerName, settings, isPrivate) => socket?.emit('create_room', { playerName, settings, isPrivate }), [socket]),
    joinRoom:    useCallback((roomId, playerName) => socket?.emit('join_room', { roomId, playerName }), [socket]),
    startGame:   useCallback(() => socket?.emit('start_game'), [socket]),
    toggleReady: useCallback(() => socket?.emit('player_ready'), [socket]),
    chooseWord:  useCallback((word) => socket?.emit('word_chosen', { word }), [socket]),
    sendGuess:   useCallback((text) => socket?.emit('guess', { text }), [socket]),
    sendChat:    useCallback((text) => socket?.emit('chat', { text }), [socket]),
    drawStart:   useCallback((data) => socket?.emit('draw_start', data), [socket]),
    drawMove:    useCallback((data) => socket?.emit('draw_move', data), [socket]),
    drawEnd:     useCallback(() => socket?.emit('draw_end'), [socket]),
    clearCanvas: useCallback(() => socket?.emit('canvas_clear'), [socket]),
    undoDraw:    useCallback(() => socket?.emit('draw_undo'), [socket]),
    leaveRoom:   useCallback(() => {
      socket?.disconnect();
      socket?.connect();
      dispatch({ type: 'LEAVE_ROOM' });
    }, [socket]),
    clearError: useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), []),
  };

  return (
    <GameContext.Provider value={{ state, actions }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}